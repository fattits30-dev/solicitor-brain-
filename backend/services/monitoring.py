import time
from collections.abc import Callable
from functools import wraps
from typing import Any

from prometheus_client import CollectorRegistry, Counter, Gauge, Histogram

# Create a custom registry
metrics_registry = CollectorRegistry()

# Request metrics
request_duration = Histogram(
    "solicitor_brain_request_duration_seconds",
    "Request duration in seconds",
    ["method", "endpoint", "status"],
    registry=metrics_registry,
)

request_count = Counter(
    "solicitor_brain_request_total",
    "Total number of requests",
    ["method", "endpoint", "status"],
    registry=metrics_registry,
)

# AI metrics
citation_checks = Counter(
    "solicitor_brain_citation_checks_total",
    "Total number of citation checks",
    ["success"],
    registry=metrics_registry,
)

hallucination_blocks = Counter(
    "solicitor_brain_hallucination_blocks_total",
    "Total number of blocked hallucinations",
    registry=metrics_registry,
)

# Document metrics
sign_offs = Counter(
    "solicitor_brain_sign_offs_total",
    "Total number of document sign-offs",
    ["status"],
    registry=metrics_registry,
)

# System metrics
active_cases = Gauge("solicitor_brain_active_cases", "Number of active cases", registry=metrics_registry)

gpu_temperature = Gauge(
    "solicitor_brain_gpu_temperature_celsius",
    "GPU temperature in Celsius",
    registry=metrics_registry,
)

gpu_usage = Gauge(
    "solicitor_brain_gpu_usage_percent",
    "GPU usage percentage",
    registry=metrics_registry,
)

# KPI metrics
auto_file_precision = Gauge(
    "solicitor_brain_auto_file_precision",
    "Auto-file precision percentage",
    registry=metrics_registry,
)

email_case_match = Gauge(
    "solicitor_brain_email_case_match",
    "Email to case matching percentage",
    registry=metrics_registry,
)

fact_check_precision = Gauge(
    "solicitor_brain_fact_check_precision",
    "Fact check precision percentage",
    registry=metrics_registry,
)

# Health check counter
health_checks = Counter(
    "solicitor_brain_health_checks_total",
    "Total number of health checks",
    registry=metrics_registry,
)


def record_request_duration(method: str, endpoint: str, status: int, duration: float) -> None:
    request_duration.labels(method=method, endpoint=endpoint, status=str(status)).observe(duration)
    request_count.labels(method=method, endpoint=endpoint, status=str(status)).inc()


def record_citation_check(success: bool) -> None:
    citation_checks.labels(success=str(success).lower()).inc()


def record_hallucination_block() -> None:
    hallucination_blocks.inc()


def record_sign_off(document_id: str, status: str, user_id: str) -> None:
    _ = document_id  # For future audit logging
    _ = user_id  # For future user tracking
    sign_offs.labels(status=status).inc()


def record_health_check() -> None:
    health_checks.inc()


def update_kpi_metrics(auto_file: float, email_match: float, fact_check: float) -> None:
    auto_file_precision.set(auto_file)
    email_case_match.set(email_match)
    fact_check_precision.set(fact_check)


def update_gpu_metrics(temperature: float, usage: float) -> None:
    gpu_temperature.set(temperature)
    gpu_usage.set(usage)


def update_active_cases(count: int) -> None:
    active_cases.set(count)


def timed(func: Callable[..., Any]) -> Callable[..., Any]:
    @wraps(func)
    async def wrapper(*args: Any, **kwargs: Any) -> Any:
        start = time.time()
        result = await func(*args, **kwargs)
        duration = time.time() - start

        # Extract endpoint from function name
        endpoint = f"/{func.__module__.split('.')[-1]}/{func.__name__}"
        record_request_duration(method="INTERNAL", endpoint=endpoint, status=200, duration=duration)

        return result

    return wrapper
