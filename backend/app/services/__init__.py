"""
Services module
"""

from .file_processor import file_processor, FileProcessorService
from .ai_analyzer import ai_analyzer, AIAnalyzerService
from .garanzie_service import garanzie_service, GaranzieService

# Import other services when they are created
# from .compagnie_service import compagnie_service
# from .confronto_service import confronto_service

__all__ = [
    "file_processor",
    "FileProcessorService",
    "ai_analyzer", 
    "AIAnalyzerService",
    "garanzie_service",
    "GaranzieService",
    # "compagnie_service",
    # "confronto_service"
]
