# ==============================================================================
# Multi-Stage Production Dockerfile for Project Pulse
# Hardened against privilege escalation, container escapes, and denial of service.
# ==============================================================================

FROM python:3.11-slim AS builder

WORKDIR /app

# Install system build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Final minimal runtime image
FROM python:3.11-slim

WORKDIR /app

# Security: Create non-root user and group
RUN groupadd -g 10001 appgroup && \
    useradd -u 10001 -g appgroup -s /sbin/nologin -M appuser

# Copy installed wheels from builder stage
COPY --from=builder /root/.local /home/appuser/.local

# Copy application assets with strict ownership
COPY --chown=appuser:appgroup app.py .
COPY --chown=appuser:appgroup model.pkl .
COPY --chown=appuser:appgroup scaler.pkl .
COPY --chown=appuser:appgroup static/ ./static/

# Environment hardening
ENV PATH=/home/appuser/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

# Drop all privileges
USER appuser

EXPOSE 8000

# Run with Gunicorn + Uvicorn workers for production concurrency
CMD ["python3", "-m", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "--proxy-headers", "--forwarded-allow-ips", "*"]
