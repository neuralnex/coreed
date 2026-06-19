# Coreed Agent Space - Docker Template
# Multi-stage build for Python-based agent spaces

# Build stage
FROM python:3.11-slim as builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Runtime stage
FROM python:3.11-slim

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /root/.local /root/.local

# Make sure scripts in .local are usable
ENV PATH=/root/.local/bin:$PATH

# Copy application code
COPY main.py .
COPY .env .

# Environment variables
ENV MODEL_PATH="/app/models/model.gguf"
ENV MODEL_NAME="Coreed Agent"
ENV SPACE_ID=1
ENV SPACE_VERSION="1.0.0"
ENV PORT=8000
ENV PYTHONUNBUFFERED=1
ENV COREED_SLEEP_TIMEOUT=3600
ENV COREED_AUTO_SLEEP=true
ENV COREED_AUTO_WAKE=true

# Expose port
EXPOSE ${PORT}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Start the application
CMD ["python", "main.py"]
