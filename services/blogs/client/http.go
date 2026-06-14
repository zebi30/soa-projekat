package client

import (
	"net/http"

	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
)

// httpClient is shared by all outbound service calls. Its transport is wrapped
// with otelhttp so each request becomes a client span and the active trace
// context (traceparent header) is injected for downstream services.
var httpClient = &http.Client{
	Transport: otelhttp.NewTransport(http.DefaultTransport),
}
