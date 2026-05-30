FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY go.mod ./
COPY go.sum ./
COPY *.go ./
COPY proto ./proto
RUN go build -o gateway .

FROM alpine:3.20
WORKDIR /app
COPY --from=builder /app/gateway .
EXPOSE 80
CMD ["./gateway"]
