"""
Utility functions for formatting garanzie data
"""

import logging
from typing import List
from app.config.database import get_supabase

logger = logging.getLogger(__name__)


async def get_all_garanzie_formatted() -> List[str]:
    """
    Recupera tutte le garanzie dal database e le formatta come stringhe
    nel formato: "Sezione: NOME_SEZIONE; Garanzia: TITOLO_GARANZIA"
    
    Returns:
        List[str]: Lista di stringhe formattate con sezione e garanzia
    """
    try:
        client = get_supabase()
        
        # Query per recuperare tutte le garanzie con le relative sezioni
        result = client.table("garanzie").select(
            "id, titolo, sezioni(nome)"
        ).execute()
        
        if not result.data:
            logger.info("Nessuna garanzia trovata nel database")
            return []
        
        formatted_garanzie = []
        
        for garanzia in result.data:
            # Estrai il nome della sezione
            sezione_nome = garanzia.get("sezioni", {}).get("nome", "SCONOSCIUTA")
            titolo_garanzia = garanzia.get("titolo", "")
            
            # Formatta la stringa come richiesto
            formatted_string = f"Sezione: {sezione_nome}; Garanzia: {titolo_garanzia}"
            formatted_garanzie.append(formatted_string)
        
        logger.info(f"Recuperate e formattate {len(formatted_garanzie)} garanzie")
        return formatted_garanzie
        
    except Exception as e:
        logger.error(f"Errore nel recupero delle garanzie formattate: {e}")
        raise Exception(f"Errore nel recupero delle garanzie: {str(e)}")


async def get_garanzie_by_sezione_formatted(sezione_nome: str) -> List[str]:
    """
    Recupera tutte le garanzie di una specifica sezione e le formatta come stringhe
    
    Args:
        sezione_nome (str): Nome della sezione da filtrare
        
    Returns:
        List[str]: Lista di stringhe formattate per la sezione specificata
    """
    try:
        client = get_supabase()
        
        # Query per recuperare le garanzie di una specifica sezione
        result = client.table("garanzie").select(
            "id, titolo, sezioni(nome)"
        ).eq("sezioni.nome", sezione_nome.upper()).execute()
        
        if not result.data:
            logger.info(f"Nessuna garanzia trovata per la sezione: {sezione_nome}")
            return []
        
        formatted_garanzie = []
        
        for garanzia in result.data:
            sezione_nome_db = garanzia.get("sezioni", {}).get("nome", "SCONOSCIUTA")
            titolo_garanzia = garanzia.get("titolo", "")
            
            formatted_string = f"Sezione: {sezione_nome_db}; Garanzia: {titolo_garanzia}"
            formatted_garanzie.append(formatted_string)
        
        logger.info(f"Recuperate {len(formatted_garanzie)} garanzie per la sezione {sezione_nome}")
        return formatted_garanzie
        
    except Exception as e:
        logger.error(f"Errore nel recupero delle garanzie per sezione {sezione_nome}: {e}")
        raise Exception(f"Errore nel recupero delle garanzie per sezione: {str(e)}")


async def get_garanzie_count_by_sezione() -> dict:
    """
    Recupera il conteggio delle garanzie per ogni sezione
    
    Returns:
        dict: Dizionario con nome sezione come chiave e conteggio come valore
    """
    try:
        client = get_supabase()
        
        # Query per contare le garanzie per sezione
        result = client.table("garanzie").select(
            "sezioni(nome)"
        ).execute()
        
        if not result.data:
            return {}
        
        sezioni_count = {}
        
        for garanzia in result.data:
            sezione_nome = garanzia.get("sezioni", {}).get("nome", "SCONOSCIUTA")
            sezioni_count[sezione_nome] = sezioni_count.get(sezione_nome, 0) + 1
        
        logger.info(f"Conteggio garanzie per sezione: {sezioni_count}")
        return sezioni_count
        
    except Exception as e:
        logger.error(f"Errore nel conteggio delle garanzie per sezione: {e}")
        raise Exception(f"Errore nel conteggio delle garanzie: {str(e)}")


async def export_garanzie_formatted_to_text() -> str:
    """
    Esporta tutte le garanzie formattate in un singolo testo
    
    Returns:
        str: Testo con tutte le garanzie formattate, una per riga
    """
    try:
        garanzie_formatted = await get_all_garanzie_formatted()
        
        if not garanzie_formatted:
            return "Nessuna garanzia trovata nel database."
        
        # Unisci tutte le garanzie con newline
        export_text = "\n".join(garanzie_formatted)
        
        # Aggiungi header con informazioni
        header = f"# EXPORT GARANZIE FORMATTATE\n"
        header += f"# Totale garanzie: {len(garanzie_formatted)}\n"
        header += f"# Formato: Sezione: NOME_SEZIONE; Garanzia: TITOLO_GARANZIA\n\n"
        
        full_export = header + export_text
        
        logger.info(f"Esportate {len(garanzie_formatted)} garanzie in formato testo")
        return full_export
        
    except Exception as e:
        logger.error(f"Errore nell'esportazione delle garanzie: {e}")
        raise Exception(f"Errore nell'esportazione: {str(e)}")
