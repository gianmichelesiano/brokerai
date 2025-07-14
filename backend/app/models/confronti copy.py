from pydantic import BaseModel, Field
from typing import List, Optional
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