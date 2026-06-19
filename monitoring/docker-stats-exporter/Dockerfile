# No third-party dependencies — stdlib only — so this image is tiny and stable.
FROM python:3.12-slim

WORKDIR /app
COPY exporter.py .

EXPOSE 9417

CMD ["python", "-u", "exporter.py"]
