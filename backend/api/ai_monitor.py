import asyncio
import json
from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, WebSocket

router = APIRouter()

# AI processing state
ai_state: dict[str, Any] = {
    "status": "idle",  # idle, processing, paused, error
    "current_task": None,
    "total_files": 0,
    "processed_files": 0,
    "errors": 0,
    "processing_rate": 0.0,
    "logs": [],
    "start_time": None,
    "active_connections": [],
}


def add_log(message: str, log_type: str = "info") -> None:
    """Add a log entry"""
    log_entry = {
        "time": datetime.now(UTC).strftime("%H:%M:%S"),
        "message": message,
        "type": log_type,
    }
    logs_list: list[dict[str, str]] = ai_state["logs"]
    logs_list.append(log_entry)
    # Keep only last 100 logs
    if len(logs_list) > 100:
        ai_state["logs"] = logs_list[-100:]


async def broadcast_state():
    """Broadcast state to all connected WebSocket clients"""
    message = json.dumps({
        "type": "state_update",
        "data": get_ai_status()
    })
    connections: list[WebSocket] = ai_state["active_connections"]
    for connection in connections:
        try:
            await connection.send_text(message)
        except Exception:
            pass


@router.get("/status", response_model=dict[str, Any])
def get_ai_status() -> dict[str, Any]:
    """Get current AI processing status"""
    return {
        "status": ai_state["status"],
        "current_task": ai_state["current_task"],
        "total_files": ai_state["total_files"],
        "processed_files": ai_state["processed_files"],
        "errors": ai_state["errors"],
        "processing_rate": ai_state["processing_rate"],
        "logs": ai_state["logs"][-20:] if ai_state["logs"] else [],  # Last 20 logs
        "progress": float(ai_state["processed_files"] / ai_state["total_files"] * 100) if ai_state["total_files"] > 0 else 0.0,
    }


@router.post("/start")
async def start_processing() -> dict[str, Any]:
    """Start AI processing"""
    if ai_state["status"] == "processing":
        return {"message": "Already processing", "status": ai_state["status"]}

    ai_state["status"] = "processing"
    ai_state["start_time"] = datetime.now(UTC)
    ai_state["total_files"] = 25  # Simulate 25 files to process
    ai_state["processed_files"] = 0
    ai_state["errors"] = 0

    add_log("AI Case Processor started", "success")
    add_log("Scanning documents folder...", "info")
    add_log(f"Found {ai_state['total_files']} case files to process", "success")

    # Start background processing
    asyncio.create_task(process_files())

    await broadcast_state()

    return {
        "message": "Processing started",
        "status": "processing",
        "total_files": ai_state["total_files"],
    }


@router.post("/pause")
async def pause_processing() -> dict[str, Any]:
    """Pause AI processing"""
    if ai_state["status"] != "processing":
        return {"message": "Not currently processing", "status": ai_state["status"]}

    ai_state["status"] = "paused"
    add_log("Processing paused by user", "info")

    await broadcast_state()

    return {"message": "Processing paused", "status": "paused"}


@router.post("/resume")
async def resume_processing() -> dict[str, Any]:
    """Resume AI processing"""
    if ai_state["status"] != "paused":
        return {"message": "Not currently paused", "status": ai_state["status"]}

    ai_state["status"] = "processing"
    add_log("Processing resumed", "info")

    # Continue background processing
    asyncio.create_task(process_files())

    await broadcast_state()

    return {"message": "Processing resumed", "status": "processing"}


@router.post("/stop")
async def stop_processing() -> dict[str, Any]:
    """Stop AI processing"""
    ai_state["status"] = "idle"
    ai_state["current_task"] = None
    add_log("Processing stopped", "info")

    await broadcast_state()

    return {"message": "Processing stopped", "status": "idle"}


async def process_files():
    """Background task to simulate file processing"""
    while ai_state["status"] in ["processing", "paused"] and ai_state["processed_files"] < ai_state["total_files"]:
        # Simulate processing a file
        file_num: int = int(ai_state["processed_files"]) + 1
        ai_state["current_task"] = f"Case_{file_num}.pdf"

        add_log(f"Processing {ai_state['current_task']}...", "info")

        # Simulate AI analysis steps
        await asyncio.sleep(1)
        add_log(f"Extracting text from {ai_state['current_task']}", "info")
        await asyncio.sleep(1)
        add_log(f"Identifying legal issues in {ai_state['current_task']}", "info")
        await asyncio.sleep(1)
        add_log(f"Checking UK law compliance for {ai_state['current_task']}", "info")
        await asyncio.sleep(1)

        # Simulate occasional insights
        if file_num % 3 == 0:
            add_log(f"Found potential contract breach in {ai_state['current_task']}", "success")
        if file_num % 5 == 0:
            add_log(f"Identified key evidence in {ai_state['current_task']}", "success")

        ai_state["processed_files"] += 1
        start_time: datetime | None = ai_state["start_time"]
        if start_time:
            elapsed_minutes = (datetime.now(UTC) - start_time).total_seconds() / 60
            ai_state["processing_rate"] = float(ai_state["processed_files"]) / elapsed_minutes if elapsed_minutes > 0 else 0.0

        add_log(f"Completed analysis of {ai_state['current_task']}", "success")

        await broadcast_state()

        # Check if paused - need to re-read status each time
        if ai_state["status"] == "paused":
            while ai_state["status"] == "paused":
                await asyncio.sleep(1)

    if int(ai_state["processed_files"]) >= int(ai_state["total_files"]):
        ai_state["status"] = "idle"
        ai_state["current_task"] = None
        add_log("All files processed successfully!", "success")
        add_log(f"Processed {ai_state['processed_files']} files with {ai_state['errors']} errors", "success")

        await broadcast_state()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    await websocket.accept()
    connections: list[WebSocket] = ai_state["active_connections"]
    connections.append(websocket)

    # Send initial state
    status_data = get_ai_status()
    await websocket.send_text(json.dumps({
        "type": "state_update",
        "data": status_data
    }))

    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except Exception:
        pass
    finally:
        active_connections: list[WebSocket] = ai_state["active_connections"]
        if websocket in active_connections:
            active_connections.remove(websocket)
