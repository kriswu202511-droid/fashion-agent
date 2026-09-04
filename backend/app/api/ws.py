import asyncio
import json
from dataclasses import dataclass

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.events import Event, event_bus
from app.core.security import decode_access_token

router = APIRouter()


@dataclass
class WSConnection:
    websocket: WebSocket
    user_id: str
    queue: asyncio.Queue


class ConnectionManager:
    def __init__(self):
        self._connections: dict[str, WSConnection] = {}

    async def connect(self, websocket: WebSocket, user_id: str) -> WSConnection:
        await websocket.accept()
        conn = WSConnection(websocket=websocket, user_id=user_id, queue=asyncio.Queue())
        self._connections[user_id] = conn
        return conn

    def disconnect(self, user_id: str):
        self._connections.pop(user_id, None)

    async def send_to(self, user_id: str, data: dict):
        conn = self._connections.get(user_id)
        if conn:
            await conn.queue.put(data)

    async def broadcast(self, data: dict):
        for conn in self._connections.values():
            await conn.queue.put(data)


manager = ConnectionManager()


async def _ws_event_handler(event: Event):
    payload = {
        "type": event.event_type,
        "source_agent": event.source_agent,
        "data": event.data,
        "timestamp": event.timestamp,
    }
    if event.target_agent:
        payload["target_agent"] = event.target_agent
    await manager.broadcast(payload)


async def _send_loop(conn: WSConnection):
    while True:
        data = await conn.queue.get()
        try:
            await conn.websocket.send_text(json.dumps(data, ensure_ascii=False))
        except Exception:
            break


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    token = websocket.query_params.get("token", "")
    payload = decode_access_token(token) if token else None

    if not payload:
        await websocket.close(code=4001, reason="invalid token")
        return

    user_id = payload.get("sub", "anonymous")
    conn = await manager.connect(websocket, user_id)

    event_bus.subscribe_all(_ws_event_handler)

    send_task = asyncio.create_task(_send_loop(conn))

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        send_task.cancel()
        event_bus.unsubscribe_all(_ws_event_handler)
        manager.disconnect(user_id)
