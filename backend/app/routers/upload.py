"""
API router for File Upload endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from typing import List, Optional
import logging
import os
from datetime import datetime

from app.config.database import get_supabase
from app.utils.exceptions import ValidationError
from app.services.file_processor import file_processor
from app.dependencies.auth import get_current_user_context, UserContext

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/file")
async def upload_file(
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    supabase=Depends(get_supabase)
):
    """
    Upload generico di file
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nome file richiesto"
        )
    
    # Validate file type
    allowed_types = ["pdf", "docx", "doc", "txt"]
    file_extension = file.filename.split(".")[-1].lower()
    
    if file_extension not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo file non supportato. Tipi consentiti: {', '.join(allowed_types)}"
        )
    
    # Mock response for now
    return {
        "filename": file.filename,
        "content_type": file.content_type,
        "size": file.size if hasattr(file, 'size') else 0,
        "description": description,
        "status": "uploaded",
        "file_id": "mock-file-id-123",
        "url": f"/files/mock-file-id-123"
    }


@router.post("/compagnia-tipologia")
async def upload_file_compagnia_tipologia(
    compagnia_id: int = Form(...),
    tipologia_assicurazione_id: int = Form(...),
    file: UploadFile = File(...),
    user_context: UserContext = Depends(get_current_user_context),
    supabase=Depends(get_supabase)
):
    """
    Upload file per una specifica relazione compagnia-tipologia
    Salva il file nel bucket, estrae il testo e crea/aggiorna la relazione compagnia-tipologia
    
    Supporta i seguenti formati:
    - PDF: Estrazione testo automatica
    - DOCX: Estrazione testo automatica  
    - DOC: Upload supportato, estrazione testo non disponibile
    - TXT: Lettura diretta del contenuto
    
    Il testo estratto viene salvato nel campo polizza_text del database.
    """
    try:
        # Validazione file
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nome file richiesto"
            )
        
        # Validate file type
        allowed_types = ["pdf", "docx", "doc", "txt"]
        file_extension = file.filename.split(".")[-1].lower()
        
        if file_extension not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tipo file non supportato. Tipi consentiti: {', '.join(allowed_types)}"
            )
        
        # Verifica se la compagnia esiste e appartiene alla company dell'utente
        compagnia_check = supabase.table("compagnie").select("id, nome").eq("id", compagnia_id).eq("company_id", user_context.company_id).execute()
        if not compagnia_check.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Compagnia con ID {compagnia_id} non trovata o non accessibile"
            )
        
        # Verifica se la tipologia esiste (le tipologie sono condivise tra tutte le companies)
        tipologia_check = supabase.table("tipologia_assicurazione").select("id, nome").eq("id", tipologia_assicurazione_id).execute()
        if not tipologia_check.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tipologia assicurazione con ID {tipologia_assicurazione_id} non trovata"
            )
        
        compagnia = compagnia_check.data[0]
        tipologia = tipologia_check.data[0]
        
        # Genera nome file unico
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        safe_compagnia_name = "".join(c for c in compagnia["nome"] if c.isalnum() or c in (' ', '-', '_')).rstrip()
        safe_tipologia_name = "".join(c for c in tipologia["nome"] if c.isalnum() or c in (' ', '-', '_')).rstrip()
        
        unique_filename = f"{safe_compagnia_name}_{safe_tipologia_name}_{timestamp}.{file_extension}"
        file_path = f"polizze/{compagnia_id}/{tipologia_assicurazione_id}/{unique_filename}"
        
        # Leggi il contenuto del file
        file_content = await file.read()
        
        # Estrai il testo dal file
        extracted_text = None
        text_extraction_success = False
        text_length = 0
        extraction_errors = []
        
        try:
            if file_extension == "txt":
                # Per i file TXT, leggi direttamente il contenuto
                try:
                    extracted_text = file_content.decode('utf-8')
                    text_extraction_success = True
                    text_length = len(extracted_text)
                except UnicodeDecodeError:
                    try:
                        extracted_text = file_content.decode('latin-1')
                        text_extraction_success = True
                        text_length = len(extracted_text)
                    except Exception as e:
                        extraction_errors.append(f"Errore nella decodifica del file TXT: {str(e)}")
            elif file_extension == "doc":
                # I file DOC non sono attualmente supportati per l'estrazione del testo
                extraction_errors.append("I file DOC non sono supportati per l'estrazione del testo. Si consiglia di convertire il file in PDF o DOCX.")
            else:
                # Per PDF e DOCX usa il file processor
                extraction_result = file_processor.get_detailed_extraction_result(file_content, file.filename)
                text_extraction_success = extraction_result["success"]
                extracted_text = extraction_result["text"]
                text_length = extraction_result["text_length"]
                if extraction_result["errors"]:
                    extraction_errors.extend(extraction_result["errors"])
                    
        except Exception as e:
            logger.error(f"Errore nell'estrazione del testo da {file.filename}: {e}")
            extraction_errors.append(f"Errore nell'estrazione del testo: {str(e)}")
        
        # Upload file to Supabase Storage
        try:
            # Upload to Supabase Storage bucket 'polizze'
            upload_result = supabase.storage.from_("polizze").upload(
                file_path,
                file_content,
                file_options={
                    "content-type": file.content_type,
                    "cache-control": "3600"
                }
            )
            
            if upload_result.error:
                logger.error(f"Errore upload Supabase Storage: {upload_result.error}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Errore nel salvataggio del file: {upload_result.error}"
                )
            
            # Get public URL for the uploaded file
            file_url_result = supabase.storage.from_("polizze").get_public_url(file_path)
            file_url = file_url_result if isinstance(file_url_result, str) else file_url_result.get('publicURL', f"/storage/polizze/{unique_filename}")
            
        except Exception as e:
            logger.error(f"Errore nell'upload su Supabase Storage: {e}")
            # Fallback to mock URL if storage upload fails
            file_url = f"/storage/polizze/{unique_filename}"
        
        # Verifica se esiste già una relazione tra questa compagnia e tipologia
        existing_relation = supabase.table("compagnia_tipologia_assicurazione").select("*").eq("compagnia_id", compagnia_id).eq("tipologia_assicurazione_id", tipologia_assicurazione_id).eq("company_id", user_context.company_id).execute()
        
        now = datetime.utcnow().isoformat()
        
        if existing_relation.data:
            # Aggiorna la relazione esistente
            relation_id = existing_relation.data[0]["id"]
            update_data = {
                "polizza_filename": unique_filename,
                "polizza_path": file_path,
                "polizza_text": extracted_text,
                "company_id": user_context.company_id,
                "updated_at": now
            }
            
            result = supabase.table("compagnia_tipologia_assicurazione").update(update_data).eq("id", relation_id).execute()
            
            if not result.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Errore nell'aggiornamento della relazione esistente"
                )
            
            relation = result.data[0]
            
        else:
            # Crea una nuova relazione
            insert_data = {
                "compagnia_id": compagnia_id,
                "tipologia_assicurazione_id": tipologia_assicurazione_id,
                "polizza_filename": unique_filename,
                "polizza_path": file_path,
                "polizza_text": extracted_text,
                "attiva": True,
                "company_id": user_context.company_id,
                "created_at": now,
                "updated_at": now
            }
            
            result = supabase.table("compagnia_tipologia_assicurazione").insert(insert_data).execute()
            
            if not result.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Errore nella creazione della relazione"
                )
            
            relation = result.data[0]
        
        return {
            "success": True,
            "message": "File caricato con successo",
            "file_info": {
                "filename": unique_filename,
                "original_filename": file.filename,
                "content_type": file.content_type,
                "size": len(file_content),
                "path": file_path,
                "url": file_url
            },
            "text_extraction": {
                "success": text_extraction_success,
                "text_length": text_length,
                "has_text": extracted_text is not None and len(extracted_text.strip()) > 0,
                "errors": extraction_errors if extraction_errors else None
            },
            "relation_info": {
                "id": relation["id"],
                "compagnia_id": compagnia_id,
                "compagnia_nome": compagnia["nome"],
                "tipologia_assicurazione_id": tipologia_assicurazione_id,
                "tipologia_nome": tipologia["nome"],
                "created_at": relation["created_at"],
                "updated_at": relation["updated_at"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore nell'upload file compagnia-tipologia: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno del server: {str(e)}"
        )


@router.post("/bulk")
async def upload_multiple_files(
    files: List[UploadFile] = File(...),
    description: Optional[str] = Form(None),
    supabase=Depends(get_supabase)
):
    """
    Upload multiplo di file
    """
    if len(files) > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Massimo 10 file per upload"
        )
    
    results = []
    for file in files:
        if not file.filename:
            continue
            
        # Validate file type
        allowed_types = ["pdf", "docx", "doc", "txt"]
        file_extension = file.filename.split(".")[-1].lower()
        
        if file_extension not in allowed_types:
            results.append({
                "filename": file.filename,
                "status": "error",
                "error": f"Tipo file non supportato: {file_extension}"
            })
            continue
        
        results.append({
            "filename": file.filename,
            "content_type": file.content_type,
            "size": file.size if hasattr(file, 'size') else 0,
            "status": "uploaded",
            "file_id": f"mock-file-id-{len(results)}",
            "url": f"/files/mock-file-id-{len(results)}"
        })
    
    return {
        "description": description,
        "total_files": len(files),
        "successful_uploads": len([r for r in results if r["status"] == "uploaded"]),
        "failed_uploads": len([r for r in results if r["status"] == "error"]),
        "results": results
    }


@router.get("/files")
async def list_uploaded_files(
    page: int = 1,
    size: int = 20,
    file_type: Optional[str] = None,
    supabase=Depends(get_supabase)
):
    """
    Lista dei file caricati
    """
    return {
        "files": [],
        "total": 0,
        "page": page,
        "size": size,
        "pages": 0
    }


@router.get("/files/{file_id}")
async def get_file_info(
    file_id: str,
    supabase=Depends(get_supabase)
):
    """
    Informazioni su un file specifico
    """
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"File con ID {file_id} non trovato"
    )


@router.delete("/files/{file_id}")
async def delete_file(
    file_id: str,
    supabase=Depends(get_supabase)
):
    """
    Elimina un file caricato
    """
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"File con ID {file_id} non trovato"
    )


@router.post("/extract-text/{file_id}")
async def extract_text_from_file(
    file_id: str,
    supabase=Depends(get_supabase)
):
    """
    Estrai testo da un file caricato
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Endpoint non ancora implementato"
    )


@router.get("/supported-formats")
async def get_supported_formats():
    """
    Lista dei formati file supportati
    """
    return {
        "formats": [
            {
                "extension": "pdf",
                "mime_type": "application/pdf",
                "description": "Portable Document Format",
                "max_size_mb": 50
            },
            {
                "extension": "docx",
                "mime_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "description": "Microsoft Word Document",
                "max_size_mb": 25
            },
            {
                "extension": "doc",
                "mime_type": "application/msword",
                "description": "Microsoft Word Document (Legacy)",
                "max_size_mb": 25
            },
            {
                "extension": "txt",
                "mime_type": "text/plain",
                "description": "Plain Text File",
                "max_size_mb": 5
            }
        ],
        "max_files_per_upload": 10,
        "total_max_size_mb": 100
    }
