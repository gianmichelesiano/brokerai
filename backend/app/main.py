"""
FastAPI main application entry point
Sistema di Confronto Garanzie Assicurative
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import logging
from contextlib import asynccontextmanager

from app.config.settings import settings
from app.routers import garanzie_router, compagnie_router, mapping_router, upload_router, system_router, tipologia_assicurazione_router, compagnia_tipologia_router, clients_router, interactions_router
from app.routers.confronti import router as confronti_router # Explicit import
from app.routers.sezioni import router as sezioni_router
from app.routers.auth import router as auth_router
from app.routers.billing import router as billing_router
from app.routers.brokers import router as brokers_router
from app.utils.exceptions import CustomException

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("🚀 Starting Policy Comparator API...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Debug mode: {settings.DEBUG}")
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down Policy Comparator API...")


# Create FastAPI app
app = FastAPI(
    title="Policy Comparator API",
    description="Sistema di Confronto Garanzie Assicurative - Backend API",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Custom exception handler
@app.exception_handler(CustomException)
async def custom_exception_handler(request, exc: CustomException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "message": exc.message,
            "detail": exc.detail,
            "error_code": exc.error_code
        }
    )


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": True,
            "message": "Errore interno del server",
            "detail": str(exc) if settings.DEBUG else "Contattare l'amministratore"
        }
    )


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Policy Comparator API",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT
    }


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Policy Comparator API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


# Include routers
app.include_router(auth_router, prefix="/api", tags=["Authentication"])
app.include_router(garanzie_router, prefix="/api/garanzie", tags=["Garanzie"])
app.include_router(compagnie_router, prefix="/api/compagnie", tags=["Compagnie"])
app.include_router(compagnia_tipologia_router, prefix="/api/compagnia-tipologia", tags=["Compagnia-Tipologia"])
app.include_router(mapping_router, prefix="/api/mapping", tags=["Mapping"])
app.include_router(confronti_router, prefix="/api/confronti", tags=["Confronti"])
app.include_router(upload_router, prefix="/api/upload", tags=["Upload"])
app.include_router(system_router, prefix="/api/system", tags=["System"])
app.include_router(tipologia_assicurazione_router, prefix="/api/tipologia-assicurazione", tags=["Tipologia Assicurazione"])
app.include_router(sezioni_router, prefix="/api/sezioni", tags=["Sezioni"])
app.include_router(billing_router, prefix="/api", tags=["Billing"])
app.include_router(brokers_router, prefix="/api", tags=["Brokers"])
app.include_router(clients_router, prefix="/api", tags=["Clients"])
app.include_router(interactions_router, prefix="/api", tags=["Interactions"])


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info"
    )
