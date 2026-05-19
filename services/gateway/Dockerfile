FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY go.mod ./
COPY *.go ./
RUN go build -o gateway .

FROM alpine:3.20
WORKDIR /app
COPY --from=builder /app/gateway .
EXPOSE 80
CMD ["./gateway"]
