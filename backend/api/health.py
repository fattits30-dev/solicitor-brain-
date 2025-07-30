from fastapi import APIRouter, HTTPException
from typing import Dict, Any, TypedDict
from pydantic import BaseModel
import psutil
import subprocess
import asyncio
from datetime import datetime, timezone

from backend.config import settings
from backend.utils.database import check_db_connection
from backend.services.monitoring import record_health_check

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
    gpu: Dict[str, Any]


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


async def get_gpu_info() -> Dict[str, Any]:
    try:
        result = await asyncio.create_subprocess_exec(
            "rocm-smi", "--showtemp", "--showuse", stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
        )
        stdout, _ = await result.communicate()

        gpu_info: Dict[str, Any] = {"available": True, "temperature": "N/A", "usage": "N/A"}

        if stdout:
            lines = stdout.decode().split("\n")
            for line in lines:
                if "GPU[" in line and "C" in line:
                    temp = line.split()[2].replace("C", "")
                    gpu_info["temperature"] = f"{temp}°C"
                if "GPU use" in line:
                    usage = line.split()[-1]
                    gpu_info["usage"] = usage

        return gpu_info
    except Exception:
        gpu_error: Dict[str, Any] = {"available": False, "error": "GPU monitoring unavailable"}
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
        timestamp=datetime.now(timezone.utc).isoformat(),
        banner=settings.compliance_banner,
        services=ServicesStatus(
            database="connected" if db_status else "disconnected",
            ollama="running",  # TODO: Check actual status
            redis="running",  # TODO: Check actual status
        ),
        system=SystemInfo(
            cpu_percent=cpu_percent, memory_percent=memory.percent, disk_percent=disk.percent, gpu=gpu_info
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
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
