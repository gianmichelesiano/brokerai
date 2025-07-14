
# app/models/confronti.py (versione semplificata)
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class ConfrontoDettaglio(BaseModel):
    compagnia: str
    clausola: str

class ConfrontoAspetto(BaseModel):
    aspetto: str
    dettagli: List[ConfrontoDettaglio]

class ConfrontoAnalysis(BaseModel):
    nome_garanzia: str
    compagnie_analizzate: List[str]
    punti_comuni: List[str]
    confronto_dettagliato: List[ConfrontoAspetto]
    riepilogo_principali_differenze: List[str]

class ConfrontoRequest(BaseModel):
    compagnia_ids: List[int] = Field(..., min_items=2)
    garanzia_ids: List[int] = Field(..., min_items=1)

class ConfrontoResult(BaseModel):
    risultati_analisi: List[ConfrontoAnalysis]
    timestamp: datetime = Field(default_factory=datetime.now)
    
    
class ConfrontoSalvatoCreate(BaseModel):
    nome: str
    descrizione: Optional[str] = None
    tipologia_id: int
    compagnie_ids: List[int]
    garanzie_ids: List[int]
    dati_confronto: Dict[str, Any]  # I risultati dell'analisi

class ConfrontoSalvato(BaseModel):
    id: int
    nome: str
    descrizione: Optional[str]
    tipologia_id: int
    tipologia_nome: Optional[str]  # Join con tipologia
    compagnie_nomi: List[str]  # Join con compagnie
    garanzie_count: int
    created_at: datetime
    updated_at: datetime

class ConfrontoSalvatoDetail(ConfrontoSalvato):
    dati_confronto: Dict[str, Any]
    compagnie_ids: List[int]
    garanzie_ids: List[int]

