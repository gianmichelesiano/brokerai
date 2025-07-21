"""
API routers module
"""

from .garanzie import router as garanzie_router
from .compagnie import router as compagnie_router
from .compagnia_tipologia import router as compagnia_tipologia_router
from .mapping import router as mapping_router
from .confronti import router as confronti_router
from .upload import router as upload_router
from .system import router as system_router
from .tipologia_assicurazione import router as tipologia_assicurazione_router
from .brokers import router as brokers_router
from .clients import router as clients_router
from .interactions import router as interactions_router

__all__ = [
    "garanzie_router",
    "compagnie_router",
    "compagnia_tipologia_router",
    "mapping_router", 
    "confronti_router",
    "upload_router",
    "system_router",
    "tipologia_assicurazione_router",
    "brokers_router",
    "clients_router",
    "interactions_router"
]
