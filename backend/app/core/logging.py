"""Logging configuration and utilities"""
import logging
import sys
from logging.config import dictConfig
from typing import Any

from app.config import settings


class StructuredFormatter(logging.Formatter):
    """JSON formatter for structured logging"""
    
    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id
        if hasattr(record, "user_id"):
            log_data["user_id"] = record.user_id
        if hasattr(record, "extra_data"):
            log_data.update(record.extra_data)
        
        import json
        return json.dumps(log_data, ensure_ascii=False)


def setup_logging():
    """Configure logging based on environment"""
    is_production = settings.app_env == "production"
    
    log_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "standard": {
                "format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
            },
            "structured": {
                "()": StructuredFormatter,
            },
        },
        "handlers": {
            "console": {
                "formatter": "structured" if is_production else "standard",
                "class": "logging.StreamHandler",
                "stream": sys.stdout,
                "level": "DEBUG",
            },
        },
        "loggers": {
            "app": {
                "handlers": ["console"],
                "level": "DEBUG" if not is_production else "INFO",
                "propagate": False,
            },
            "uvicorn": {
                "handlers": ["console"],
                "level": "INFO",
                "propagate": False,
            },
            "uvicorn.error": {
                "handlers": ["console"],
                "level": "INFO",
                "propagate": False,
            },
            "uvicorn.access": {
                "handlers": ["console"],
                "level": "WARNING" if is_production else "INFO",
                "propagate": False,
            },
        },
        "root": {
            "handlers": ["console"],
            "level": "WARNING" if is_production else "INFO",
        },
    }
    
    dictConfig(log_config)


def get_logger(name: str) -> logging.Logger:
    """Get a logger instance"""
    return logging.getLogger(name)


class LoggerAdapter(logging.LoggerAdapter):
    """Logger adapter for adding context to log messages"""
    
    def process(self, msg: str, kwargs: dict) -> tuple[str, dict]:
        extra = kwargs.get("extra", {})
        if self.extra:
            extra.update(self.extra)
        kwargs["extra"] = extra
        return msg, kwargs


def get_context_logger(name: str, **context: Any) -> LoggerAdapter:
    """Get a logger with context information"""
    logger = get_logger(name)
    return LoggerAdapter(logger, context)
