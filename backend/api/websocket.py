import asyncio
import json
from datetime import datetime
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.active_connections: set[WebSocket] = set()
        self.connection_info: dict[WebSocket, dict[str, Any]] = {}

    async def connect(self, websocket: WebSocket, client_id: str | None = None):
        await websocket.accept()
        self.active_connections.add(websocket)
        self.connection_info[websocket] = {
            "client_id": client_id,
            "connected_at": datetime.now(),
            "last_ping": datetime.now(),
        }
        await self.broadcast_connection_status()

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        self.connection_info.pop(websocket, None)
        asyncio.create_task(self.broadcast_connection_status())

    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except Exception:
            # Connection might be closed
            self.disconnect(websocket)

    async def broadcast(self, message: str):
        # Send to all connected clients
        disconnected: list[Any] = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                disconnected.append(connection)

        # Clean up disconnected clients
        for conn in disconnected:
            self.disconnect(conn)

    async def broadcast_json(self, data: dict[str, Any]):
        await self.broadcast(json.dumps(data))

    async def broadcast_connection_status(self):
        """Broadcast the number of active connections"""
        status = {
            "type": "system.status",
            "data": {
                "active_connections": len(self.active_connections),
                "timestamp": datetime.now().isoformat(),
            },
        }
        await self.broadcast_json(status)

    async def handle_ping(self, websocket: WebSocket):
        """Handle ping message from client"""
        if websocket in self.connection_info:
            self.connection_info[websocket]["last_ping"] = datetime.now()
        await websocket.send_json({"type": "pong"})


# Create singleton instance
manager = ConnectionManager()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Main WebSocket endpoint"""
    client_id = websocket.query_params.get("client_id", None)

    await manager.connect(websocket, client_id)

    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()

            try:
                message = json.loads(data)

                # Handle different message types
                if message.get("type") == "ping":
                    await manager.handle_ping(websocket)

                elif message.get("type") == "subscribe":
                    # Handle subscription to specific events
                    # TODO: Implement event subscription logic
                    # events = message.get("events", [])
                    pass

                elif message.get("type") == "message":
                    # Echo message back to sender for now
                    response = {
                        "type": "message.echo",
                        "data": {
                            "original": message.get("data"),
                            "timestamp": datetime.now().isoformat(),
                        },
                    }
                    await websocket.send_json(response)

            except json.JSONDecodeError:
                # Invalid JSON
                await websocket.send_json({"type": "error", "data": {"message": "Invalid JSON format"}})

    except WebSocketDisconnect:
        manager.disconnect(websocket)


# Helper functions to broadcast events from other parts of the application


async def broadcast_document_event(event_type: str, document_data: dict[str, Any]):
    """Broadcast document-related events"""
    event = {"type": f"document.{event_type}", "data": document_data}
    await manager.broadcast_json(event)


async def broadcast_case_event(event_type: str, case_data: dict[str, Any]):
    """Broadcast case-related events"""
    event = {"type": f"case.{event_type}", "data": case_data}
    await manager.broadcast_json(event)


async def broadcast_ai_event(event_type: str, ai_data: dict[str, Any]):
    """Broadcast AI processing events"""
    event = {"type": f"ai.{event_type}", "data": ai_data}
    await manager.broadcast_json(event)


async def broadcast_system_notification(level: str, message: str):
    """Broadcast system notifications"""
    event = {
        "type": "system.notification",
        "data": {
            "level": level,
            "message": message,
            "timestamp": datetime.now().isoformat(),
        },
    }
    await manager.broadcast_json(event)
