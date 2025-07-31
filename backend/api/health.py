import asyncio
import subprocess
from datetime import UTC, datetime
from typing import Any, TypedDict

import httpx
import psutil
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.config import settings
from backend.services.monitoring import record_health_check
from backend.utils.database import check_db_connection

router = APIRouter()


class GPUInfo(TypedDict, total=False):
    available: bool
    temperature: str
    usage: str
    error: str


class ServicesStatus(BaseModel):
    database: str
    ollama: str
    redis: str


class SystemInfo(BaseModel):
    cpu_percent: float
    memory_percent: float
    disk_percent: float
    gpu: dict[str, Any]


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    banner: str
    services: ServicesStatus
    system: SystemInfo


class SystemHealthResponse(BaseModel):
    gpu_temp: str
    gpu_usage: str
    smart_status: str
    timestamp: str


async def get_gpu_info() -> dict[str, Any]:
    try:
        # Try with sudo first (using password 0)
        result = await asyncio.create_subprocess_shell(
            "echo '0' | sudo -S rocm-smi --showtemp --showuse 2>/dev/null",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, _ = await result.communicate()

        if not stdout or result.returncode != 0:
            # Fallback to regular rocm-smi
            result = await asyncio.create_subprocess_exec(
                "rocm-smi",
                "--showtemp",
                "--showuse",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, _ = await result.communicate()

        gpu_info: dict[str, Any] = {
            "available": False,
            "temperature": "N/A",
            "usage": "N/A",
            "name": "Unknown",
        }

        if stdout:
            lines = stdout.decode().split("\n")
            gpu_detected = False

            for line in lines:
                # Check for GPU temperature (format: "0    53.0c")
                if line.strip() and line[0].isdigit() and "c" in line.lower():
                    parts = line.split()
                    if len(parts) >= 2:
                        temp = parts[1].replace("c", "").replace("C", "")
                        gpu_info["temperature"] = f"{temp}°C"
                        gpu_info["available"] = True
                        gpu_detected = True

                # Check for GPU usage percentage
                if "GPU use (%)" in line and ":" in line:
                    usage = line.split(":")[-1].strip()
                    gpu_info["usage"] = f"{usage}%"

                # Detect RX 6600 XT
                if "6600" in line or "navi" in line.lower():
                    gpu_info["name"] = "AMD RX 6600 XT"

            if gpu_detected and gpu_info["name"] == "Unknown":
                gpu_info["name"] = "AMD GPU"

        return gpu_info
    except Exception as e:
        gpu_error: dict[str, Any] = {
            "available": False,
            "error": f"GPU monitoring unavailable: {str(e)}",
            "temperature": "N/A",
            "usage": "N/A",
            "name": "Not detected",
        }
        return gpu_error


@router.get("/", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    record_health_check()

    db_status = await check_db_connection()
    gpu_info = await get_gpu_info()

    cpu_percent = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage(settings.data_root)

    health_status = HealthResponse(
        status="healthy" if db_status else "degraded",
        timestamp=datetime.now(UTC).isoformat(),
        banner=settings.compliance_banner,
        services=ServicesStatus(
            database="connected" if db_status else "disconnected",
            ollama="running",  # TODO: Check actual status
            redis="running",  # TODO: Check actual status
        ),
        system=SystemInfo(
            cpu_percent=cpu_percent,
            memory_percent=memory.percent,
            disk_percent=disk.percent,
            gpu=gpu_info,
        ),
    )

    if not db_status:
        raise HTTPException(status_code=503, detail=health_status.model_dump())

    return health_status


@router.get("/syshealth", response_model=SystemHealthResponse)
async def system_health() -> SystemHealthResponse:
    gpu_info = await get_gpu_info()

    # Get SMART data for primary disk
    smart_status = "OK"
    try:
        result = subprocess.run(["smartctl", "-H", "/dev/sda"], capture_output=True, text=True)
        if "PASSED" not in result.stdout:
            smart_status = "WARNING"
    except Exception:
        smart_status = "UNKNOWN"

    return SystemHealthResponse(
        gpu_temp=gpu_info.get("temperature", "N/A"),
        gpu_usage=gpu_info.get("usage", "N/A"),
        smart_status=smart_status,
        timestamp=datetime.now(UTC).isoformat(),
    )


@router.get("/ai")
async def get_ai_status() -> dict[str, Any]:
    """Check AI model status and system info"""
    try:
        async with httpx.AsyncClient() as client:
            # Check if Ollama is running
            try:
                response = await client.get(f"{settings.ollama_host}/api/tags", timeout=5.0)
                models = response.json()

                # Find our primary model
                model_info = None
                for model in models.get("models", []):
                    if model["name"] == settings.primary_model:
                        model_info = model
                        break

                # Check GPU status
                gpu_info = await get_gpu_info()

                return {
                    "status": "online",
                    "model": settings.primary_model,
                    "model_size": model_info.get("size", "N/A") if model_info else "Not installed",
                    "gpu_enabled": gpu_info.get("available", False),
                    "gpu_name": gpu_info.get("name", "Not detected"),
                    "gpu_temperature": gpu_info.get("temperature", "N/A"),
                    "gpu_usage": gpu_info.get("usage", "N/A"),
                    "available_models": [m["name"] for m in models.get("models", [])],
                }

            except httpx.ConnectError:
                return {
                    "status": "offline",
                    "error": "Ollama service not running",
                    "hint": "Start Ollama with: ollama serve",
                }
            except Exception as e:
                return {"status": "error", "error": str(e)}

    except Exception as e:
        return {"status": "error", "error": str(e)}
