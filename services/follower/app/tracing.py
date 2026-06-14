"""OpenTelemetry tracing setup for the follower service.

This mirrors the tracing wiring used by the Go services (e.g. blogs): an
OTLP/HTTP span exporter pointing at the collector configured through
OTEL_EXPORTER_OTLP_ENDPOINT (e.g. http://jaeger:4318) is installed as the
global tracer provider, with W3C trace context + baggage propagation so the
trace started by an upstream service (blogs) continues into this service.
"""

import os

from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.propagate import set_global_textmap
from opentelemetry.propagators.composite import CompositePropagator
from opentelemetry.baggage.propagation import W3CBaggagePropagator
from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor


def service_name() -> str:
    """Return the configured service name (OTEL_SERVICE_NAME) or a default."""
    return os.getenv("OTEL_SERVICE_NAME") or "follower-service"


def configure_tracing(app) -> None:
    """Install the global tracer provider and instrument the FastAPI app.

    The OTLP/HTTP exporter reads OTEL_EXPORTER_OTLP_ENDPOINT from the
    environment and appends the /v1/traces path automatically. FastAPI
    instrumentation creates a server span for every incoming request and
    extracts the inbound trace context, so requests forwarded from the blogs
    service appear as children of the originating trace.
    """
    resource = Resource.create({"service.name": service_name()})
    provider = TracerProvider(resource=resource)
    provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter()))
    trace.set_tracer_provider(provider)

    # W3C trace context + baggage so context propagates across services.
    set_global_textmap(
        CompositePropagator(
            [TraceContextTextMapPropagator(), W3CBaggagePropagator()]
        )
    )

    # Imported lazily so the rest of the app still works if the optional
    # instrumentation package is unavailable.
    from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

    FastAPIInstrumentor.instrument_app(app)


def get_tracer():
    """Return a tracer for creating manual spans around domain operations."""
    return trace.get_tracer(service_name())
