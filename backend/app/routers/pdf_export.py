"""
API router for PDF export endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from typing import List
import logging
import asyncio

from app.models.companies import UserContext
from app.dependencies.auth import get_current_user_context
from app.config.database import get_supabase
from app.services.pdf_generator import pdf_service
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter()

class PDFExportRequest(BaseModel):
    confronto_id: int

class PDFExportLiveRequest(BaseModel):
    tipologia_nome: str
    compagnie_nomi: List[str]
    garanzie_nomi: List[str]
    risultati_analisi: List[dict]
    timestamp: str

@router.post("/confronto/{confronto_id}")
async def export_confronto_pdf(
    confronto_id: int,
    user_context: UserContext = Depends(get_current_user_context),
    supabase=Depends(get_supabase)
):
    """
    Esporta un confronto salvato in PDF
    """
    try:
        # Recupera i dati del confronto dal database
        confronto_result = supabase.table("confronti_salvati").select(
            "*, tipologia_assicurazione(nome)"
        ).eq("id", confronto_id).eq("utente_id", user_context.user_id).execute()
        
        if not confronto_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Confronto non trovato"
            )
        
        confronto = confronto_result.data[0]
        
        # Verifica che ci siano i dati necessari
        if not confronto.get("dati_confronto") or not confronto["dati_confronto"].get("risultati_analisi"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Dati del confronto non disponibili per l'export PDF"
            )
        
        # Prepara i dati per la generazione PDF
        tipologia_nome = confronto.get("tipologia_assicurazione", {}).get("nome", "Tipologia Sconosciuta") if confronto.get("tipologia_assicurazione") else "Tipologia Sconosciuta"
        
        # Recupera i nomi delle compagnie separatamente
        compagnie_ids = confronto.get("compagnie_ids", [])
        compagnie_nomi = []
        if compagnie_ids:
            compagnie_result = supabase.table("compagnie").select("nome").in_("id", compagnie_ids).execute()
            compagnie_nomi = [c['nome'] for c in compagnie_result.data if c.get('nome')]
        
        # Estrai i nomi delle garanzie dai risultati
        garanzie_nomi = []
        if confronto["dati_confronto"].get("risultati_analisi"):
            garanzie_nomi = [analisi.get("nome_garanzia", "") for analisi in confronto["dati_confronto"]["risultati_analisi"]]
        
        # Genera il PDF
        pdf_bytes = await pdf_service.generate_confronto_pdf(
            confronto_data=confronto["dati_confronto"],
            tipologia_nome=tipologia_nome,
            compagnie_nomi=compagnie_nomi,
            garanzie_nomi=garanzie_nomi
        )
        
        # Genera nome file
        nome_file_sanitized = confronto["nome"].lower().replace(" ", "-").replace("/", "-")
        filename = f"confronto-{nome_file_sanitized}-{confronto_id}.pdf"
        
        # Ritorna il PDF come response
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Content-Type": "application/pdf"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore nell'export PDF confronto {confronto_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore nella generazione PDF: {str(e)}"
        )

@router.post("/confronto/live")
async def export_live_confronto_pdf(
    request: PDFExportLiveRequest,
    user_context: UserContext = Depends(get_current_user_context)
):
    """
    Esporta un confronto live (non salvato) in PDF
    """
    try:
        # Prepara i dati del confronto
        confronto_data = {
            "risultati_analisi": request.risultati_analisi,
            "timestamp": request.timestamp
        }
        
        # Genera il PDF
        pdf_bytes = await pdf_service.generate_confronto_pdf(
            confronto_data=confronto_data,
            tipologia_nome=request.tipologia_nome,
            compagnie_nomi=request.compagnie_nomi,
            garanzie_nomi=request.garanzie_nomi
        )
        
        # Genera nome file
        tipologia_sanitized = request.tipologia_nome.lower().replace(" ", "-").replace("/", "-")
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        filename = f"confronto-{tipologia_sanitized}-{timestamp}.pdf"
        
        # Ritorna il PDF come response
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Content-Type": "application/pdf"
            }
        )
        
    except Exception as e:
        logger.error(f"Errore nell'export PDF confronto live: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore nella generazione PDF: {str(e)}"
        )

@router.get("/health")
async def health_check():
    """
    Verifica lo stato del servizio PDF
    """
    try:
        # Test del servizio (senza generare realmente un PDF)
        return {
            "status": "ok",
            "service": "pdf_export",
            "message": "Servizio PDF export funzionante"
        }
    except Exception as e:
        logger.error(f"Health check fallito: {e}")
        return {
            "status": "error",
            "service": "pdf_export",
            "error": str(e),
            "message": "Errore nel servizio PDF export"
        }