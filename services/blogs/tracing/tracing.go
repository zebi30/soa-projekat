package tracing

import (
	"context"
	"os"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.26.0"
)

// ServiceName returns the configured service name (OTEL_SERVICE_NAME) or a default.
func ServiceName() string {
	if name := os.Getenv("OTEL_SERVICE_NAME"); name != "" {
		return name
	}
	return "blogs-service"
}

// Init sets up an OTLP/HTTP trace exporter pointing at the collector configured
// through OTEL_EXPORTER_OTLP_ENDPOINT (e.g. http://jaeger:4318) and installs it
// as the global tracer provider. It returns a shutdown function that flushes any
// pending spans and should be deferred from main.
func Init(ctx context.Context) (func(context.Context) error, error) {
	// otlptracehttp.New reads OTEL_EXPORTER_OTLP_ENDPOINT from the environment.
	exporter, err := otlptracehttp.New(ctx)
	if err != nil {
		return nil, err
	}

	res, err := resource.New(ctx,
		resource.WithFromEnv(),
		resource.WithAttributes(semconv.ServiceName(ServiceName())),
	)
	if err != nil {
		return nil, err
	}

	tp := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exporter),
		sdktrace.WithResource(res),
	)

	otel.SetTracerProvider(tp)
	// W3C trace context + baggage so context propagates to downstream services.
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	))

	return tp.Shutdown, nil
}
