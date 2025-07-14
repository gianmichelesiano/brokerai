"""
AI Extractor Service for Policy Analysis
"""

import os
from pydantic import BaseModel, Field
from typing import List, Optional
from langchain_openai import ChatOpenAI
import logging

logger = logging.getLogger(__name__)


class RisultatoEstrazione(BaseModel):
    """Schema per il risultato dell'estrazione AI"""
    titolo: str = Field(description="Titolo della sezione estratta")
    testo_estratto: str = Field(description="Testo completo della sezione estratta")
    riferimenti_articoli: str = Field(description="Riferimento principale dell'articolo (es. Art.38 Lettera E)")


async def estrai_sezione_ai(
    polizza_text: str, 
    sezione: str, 
    titolo: str = "", 
    descrizione: str = ""
) -> Optional[RisultatoEstrazione]:
    """
    Estrae sezione specifica dal testo della polizza usando AI
    
    Args:
        polizza_text: Testo completo della polizza
        sezione: Nome della sezione da cercare
        titolo: Titolo specifico della garanzia (opzionale)
        descrizione: Descrizione della garanzia (opzionale)
    
    Returns:
        RisultatoEstrazione: Oggetto con testo estratto e riferimenti articoli
        None: Se l'estrazione fallisce
    """
    
    # Verifica API key
    if not os.getenv("OPENAI_API_KEY"):
        logger.warning("OPENAI_API_KEY non configurata")
        return None
    
    if not polizza_text or not polizza_text.strip():
        logger.warning("Testo polizza vuoto o non valido")
        return None
    
    try:
        # Configura il modello
        model = ChatOpenAI(
            model="gpt-4.1-mini",
            temperature=0,
            api_key=os.getenv("OPENAI_API_KEY")
        ).with_structured_output(RisultatoEstrazione)
        
        # Crea il prompt
        prompt = f"""
Analizza il seguente documento assicurativo ed estrai tutte le informazioni relative a:

SEZIONE: {sezione}
TITOLO: {titolo if titolo else "Non specificato"}
DESCRIZIONE: {descrizione if descrizione else "Non specificata"}

ISTRUZIONI:
1. Estrai il titolo della sezione/articolo trovato nel documento
2. Trova e estrai tutto il testo completo che tratta l'argomento richiesto
3. Identifica tutti i riferimenti degli articoli (es. Art.38 Lettera E, Art.22, Clausola 5.1, ecc.)
4. Mantieni il testo originale senza modifiche o riassunti
5. Se ci sono più parti correlate all'argomento, includile tutte
6. Se non trovi informazioni specifiche per il titolo e la descrizione richiesti nella polizza, restituisci "Non prevista" nel titolo e nel testo estratto
7. Se non trovi riferimenti articoli, restituisci "Non specificato"

DOCUMENTO ASSICURATIVO:
{polizza_text}
"""
        
        logger.info(f"Elaborazione AI per sezione: {sezione}")
        if titolo:
            logger.info(f"Titolo specifico: {titolo}")
        
        # Invoca il modello
        risultato = await model.ainvoke(prompt)
        
        logger.info(f"Estrazione AI completata - Titolo: {risultato.titolo}")
        logger.info(f"Riferimenti trovati: {len(risultato.riferimenti_articoli)}")
        
        return risultato
        
    except Exception as e:
        logger.error(f"Errore nell'elaborazione AI: {e}")
        return None


def estrai_sezione_ai_sync(
    polizza_text: str, 
    sezione: str, 
    titolo: str = "", 
    descrizione: str = ""
) -> Optional[RisultatoEstrazione]:
    """
    Versione sincrona dell'estrazione AI (per compatibilità)
    """
    
    # Verifica API key
    if not os.getenv("OPENAI_API_KEY"):
        logger.warning("OPENAI_API_KEY non configurata")
        return None
    
    if not polizza_text or not polizza_text.strip():
        logger.warning("Testo polizza vuoto o non valido")
        return None
    
    try:
        # Configura il modello
        model = ChatOpenAI(
            model="gpt-4.1-mini",
            temperature=0,
            api_key=os.getenv("OPENAI_API_KEY")
        ).with_structured_output(RisultatoEstrazione)
        
        # Crea il prompt
        prompt = f"""
Analizza il seguente documento assicurativo ed estrai tutte le informazioni relative a:

SEZIONE: {sezione}
TITOLO: {titolo if titolo else "Non specificato"}
DESCRIZIONE: {descrizione if descrizione else "Non specificata"}

ISTRUZIONI:
1. Estrai il titolo della sezione/articolo trovato nel documento
2. Trova e estrai tutto il testo completo che tratta l'argomento richiesto
3. Identifica tutti i riferimenti degli articoli (es. Art.38 Lettera E, Art.22, Clausola 5.1, ecc.)
4. Mantieni il testo originale senza modifiche o riassunti
5. Se ci sono più parti correlate all'argomento, includile tutte
6. Se non trovi informazioni specifiche per il titolo e la descrizione richiesti nella polizza, restituisci "Non prevista" nel titolo e nel testo estratto
7. Se non trovi riferimenti articoli, restituisci "Non specificato"

DOCUMENTO ASSICURATIVO:
{polizza_text}
"""
        
        logger.info(f"Elaborazione AI sincrona per sezione: {sezione}")
        
        # Invoca il modello
        risultato = model.invoke(prompt)
        
        logger.info(f"Estrazione AI completata - Titolo: {risultato.titolo}")
        logger.info(f"Riferimenti trovati: {len(risultato.riferimenti_articoli)}")
        
        return risultato
        
    except Exception as e:
        logger.error(f"Errore nell'elaborazione AI sincrona: {e}")
        return None


def is_ai_available() -> bool:
    """
    Verifica se il servizio AI è disponibile
    
    Returns:
        bool: True se l'AI è configurata e disponibile
    """
    return bool(os.getenv("OPENAI_API_KEY"))
