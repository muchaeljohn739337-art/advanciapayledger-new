# Multi-stage build for AI Orchestrator
FROM python:3.11-slim AS base

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies
FROM base AS deps
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /opt/venv /opt/venv
COPY . .

# Install the application
RUN pip install -e .

# Production stage
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN useradd --create-home --shell /bin/bash appuser

# Copy virtual environment and application
COPY --from=builder /opt/venv /opt/venv
COPY --from=builder /app .

# Set permissions
RUN chown -R appuser:appuser /app
USER appuser

# Set environment variables
ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONPATH=/app
ENV NODE_ENV=production
ENV PORT=4004

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:4004/health', timeout=5)"

# Expose port
EXPOSE 4004

# Start the application
CMD ["python", "-m", "ai_orchestrator.main"]
