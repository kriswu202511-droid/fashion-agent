"""Logging and error tracking middleware"""
import time
import uuid
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.logging import get_logger

logger = get_logger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log all HTTP requests"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        start_time = time.time()
        
        logger.info(
            f"{request.method} {request.url.path}",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "query": str(request.query_params) if request.query_params else None,
                "client_ip": request.client.host if request.client else None,
                "user_agent": request.headers.get("user-agent"),
            },
        )
        
        try:
            response = await call_next(request)
            process_time = time.time() - start_time
            
            logger.info(
                f"{request.method} {request.url.path} - {response.status_code}",
                extra={
                    "request_id": request_id,
                    "status_code": response.status_code,
                    "process_time_ms": round(process_time * 1000, 2),
                },
            )
            
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Process-Time"] = str(round(process_time * 1000, 2))
            
            return response
        
        except Exception as exc:
            process_time = time.time() - start_time
            
            logger.error(
                f"{request.method} {request.url.path} - ERROR: {str(exc)}",
                extra={
                    "request_id": request_id,
                    "status_code": 500,
                    "process_time_ms": round(process_time * 1000, 2),
                    "error": str(exc),
                    "error_type": type(exc).__name__,
                },
                exc_info=True,
            )
            raise


class ErrorTrackingMiddleware(BaseHTTPMiddleware):
    """Middleware to track and log unhandled exceptions"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        try:
            return await call_next(request)
        except Exception as exc:
            request_id = getattr(request.state, "request_id", "unknown")
            
            logger.error(
                f"Unhandled exception: {type(exc).__name__}: {str(exc)}",
                extra={
                    "request_id": request_id,
                    "path": request.url.path,
                    "method": request.method,
                    "error_type": type(exc).__name__,
                    "error_message": str(exc),
                },
                exc_info=True,
            )
            
            raise
