import asyncio
import json
import logging
from dataclasses import dataclass

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.events import Event, event_bus
from app.core.security import decode_access_token

logger = logging.getLogger(__name__)

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


@dataclass
class SessionWSConnection:
    websocket: WebSocket
    session_id: str
    user_id: str
    queue: asyncio.Queue


class SessionConnectionManager:
    def __init__(self):
        self._connections: dict[str, list[SessionWSConnection]] = {}

    async def connect(self, websocket: WebSocket, session_id: str, user_id: str) -> SessionWSConnection:
        await websocket.accept()
        conn = SessionWSConnection(websocket=websocket, session_id=session_id, user_id=user_id, queue=asyncio.Queue())
        if session_id not in self._connections:
            self._connections[session_id] = []
        self._connections[session_id].append(conn)
        return conn

    def disconnect(self, session_id: str, conn: SessionWSConnection):
        conns = self._connections.get(session_id)
        if conns:
            conns[:] = [c for c in conns if c is not conn]
            if not conns:
                del self._connections[session_id]

    async def send_to_session(self, session_id: str, data: dict):
        for conn in self._connections.get(session_id, []):
            await conn.queue.put(data)


session_manager = SessionConnectionManager()


async def _livestream_event_handler(event: Event):
    if not event.event_type.startswith("livestream."):
        return
    session_id = event.data.get("session_id")
    if not session_id:
        logger.warning(f"Livestream event {event.event_type} missing session_id")
        return
    payload = {
        "type": event.event_type,
        "data": event.data,
        "timestamp": event.timestamp,
    }
    conn_count = len(session_manager._connections.get(session_id, []))
    logger.info(f"Sending event {event.event_type} to session {session_id} ({conn_count} connections)")
    await session_manager.send_to_session(session_id, payload)


async def _session_send_loop(conn: SessionWSConnection):
    while True:
        data = await conn.queue.get()
        try:
            await conn.websocket.send_text(json.dumps(data, ensure_ascii=False))
        except Exception:
            break


@router.websocket("/livestream/ws/{session_id}")
async def livestream_ws_endpoint(websocket: WebSocket, session_id: str):
    token = websocket.query_params.get("token", "")
    payload = decode_access_token(token) if token else None

    if not payload:
        logger.warning(f"WebSocket connection rejected: invalid token for session {session_id}")
        await websocket.close(code=4001, reason="invalid token")
        return

    user_id = payload.get("sub", "anonymous")
    conn = await session_manager.connect(websocket, session_id, user_id)
    logger.info(f"WebSocket connected: user={user_id}, session={session_id}")

    event_bus.subscribe_all(_livestream_event_handler)

    send_task = asyncio.create_task(_session_send_loop(conn))

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: user={user_id}, session={session_id}")
    finally:
        send_task.cancel()
        event_bus.unsubscribe_all(_livestream_event_handler)
        session_manager.disconnect(session_id, conn)


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
