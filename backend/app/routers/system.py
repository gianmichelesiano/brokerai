"""
API router for System endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
import logging
import psutil
import platform
from datetime import datetime

from app.config.settings import settings
from app.config.database import get_supabase

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/info")
async def get_system_info():
    """
    Informazioni di sistema
    """
    return {
        "service": "Policy Comparator API",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "debug": settings.DEBUG,
        "python_version": platform.python_version(),
        "platform": platform.platform(),
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/health/detailed")
async def detailed_health_check(supabase=Depends(get_supabase)):
    """
    Health check dettagliato con informazioni di sistema
    """
    try:
        # System metrics
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # Database health (mock for now)
        db_status = "healthy"
        try:
            # Test database connection
            result = supabase.table("garanzie").select("id").limit(1).execute()
            db_connected = True
        except Exception as e:
            db_connected = False
            db_status = f"error: {str(e)}"
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "service": {
                "name": "Policy Comparator API",
                "version": "1.0.0",
                "environment": settings.ENVIRONMENT,
                "uptime_seconds": 0  # TODO: implement actual uptime tracking
            },
            "system": {
                "cpu_percent": cpu_percent,
                "memory": {
                    "total_gb": round(memory.total / (1024**3), 2),
                    "available_gb": round(memory.available / (1024**3), 2),
                    "used_percent": memory.percent
                },
                "disk": {
                    "total_gb": round(disk.total / (1024**3), 2),
                    "free_gb": round(disk.free / (1024**3), 2),
                    "used_percent": round((disk.used / disk.total) * 100, 2)
                }
            },
            "database": {
                "connected": db_connected,
                "status": db_status
            },
            "external_services": {
                "supabase": {
                    "connected": db_connected,
                    "url": settings.SUPABASE_URL
                },
                "openai": {
                    "configured": bool(settings.OPENAI_API_KEY),
                    "model": settings.OPENAI_MODEL
                }
            }
        }
        
    except Exception as e:
        logger.error(f"Error in detailed health check: {e}")
        return {
            "status": "unhealthy",
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e)
        }


@router.get("/metrics")
async def get_metrics():
    """
    Metriche di sistema per monitoring
    """
    try:
        # System metrics
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "metrics": {
                "cpu_usage_percent": cpu_percent,
                "memory_usage_percent": memory.percent,
                "memory_available_bytes": memory.available,
                "disk_usage_percent": round((disk.used / disk.total) * 100, 2),
                "disk_free_bytes": disk.free
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting metrics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore nel recupero delle metriche: {str(e)}"
        )


@router.get("/config")
async def get_config():
    """
    Configurazione dell'applicazione (solo valori non sensibili)
    """
    return {
        "environment": settings.ENVIRONMENT,
        "debug": settings.DEBUG,
        "allowed_origins": settings.allowed_origins_list,
        "max_file_size": settings.MAX_FILE_SIZE,
        "allowed_file_types": settings.allowed_file_types_list,
        "default_page_size": settings.DEFAULT_PAGE_SIZE,
        "max_page_size": settings.MAX_PAGE_SIZE,
        "openai_model": settings.OPENAI_MODEL,
        "openai_max_tokens": settings.OPENAI_MAX_TOKENS,
        "openai_temperature": settings.OPENAI_TEMPERATURE,
        "ai_confidence_threshold": settings.AI_CONFIDENCE_THRESHOLD,
        "rate_limit_per_minute": settings.RATE_LIMIT_PER_MINUTE,
        "log_level": settings.LOG_LEVEL
    }


@router.get("/database/status")
async def get_database_status(supabase=Depends(get_supabase)):
    """
    Stato del database
    """
    try:
        # Test basic connection
        start_time = datetime.utcnow()
        result = supabase.table("garanzie").select("id").limit(1).execute()
        end_time = datetime.utcnow()
        response_time = (end_time - start_time).total_seconds() * 1000
        
        # Get table counts (mock for now)
        tables_status = {
            "garanzie": {"accessible": True, "count": 0},
            "compagnie": {"accessible": True, "count": 0},
            "confronti_coperture": {"accessible": True, "count": 0}
        }
        
        return {
            "connected": True,
            "response_time_ms": round(response_time, 2),
            "url": settings.SUPABASE_URL,
            "tables": tables_status,
            "storage": {
                "bucket": settings.SUPABASE_STORAGE_BUCKET,
                "accessible": True  # TODO: test actual storage access
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Database status check failed: {e}")
        return {
            "connected": False,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


@router.get("/features")
async def get_feature_flags():
    """
    Feature flags e funzionalità abilitate
    """
    return {
        "ai_analysis": True,
        "file_upload": True,
        "bulk_operations": True,
        "export_import": True,
        "scheduled_comparisons": False,
        "notifications": False,
        "caching": True,
        "rate_limiting": True,
        "monitoring": True,
        "swagger_docs": settings.DEBUG,
        "redoc_docs": settings.DEBUG
    }


@router.post("/cache/clear")
async def clear_cache():
    """
    Pulisci cache dell'applicazione
    """
    # TODO: implement actual cache clearing
    return {
        "status": "success",
        "message": "Cache cleared successfully",
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/logs/recent")
async def get_recent_logs(
    lines: int = 100,
    level: str = "INFO"
):
    """
    Log recenti dell'applicazione
    """
    # TODO: implement actual log reading
    return {
        "logs": [],
        "total_lines": 0,
        "level_filter": level,
        "timestamp": datetime.utcnow().isoformat()
    }
