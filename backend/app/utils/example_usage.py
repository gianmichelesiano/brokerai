"""
Example usage of garanzie_formatter functions
This file shows how to integrate the formatter functions into FastAPI routers
"""

from fastapi import APIRouter, HTTPException
from typing import List
from app.utils.garanzie_formatter import (
    get_all_garanzie_formatted,
    get_garanzie_by_sezione_formatted,
    get_garanzie_count_by_sezione,
    export_garanzie_formatted_to_text
)

# Example router that could be added to your FastAPI app
router = APIRouter(prefix="/api/garanzie-formatted", tags=["Garanzie Formatted"])


@router.get("/all", response_model=List[str])
async def get_all_garanzie_formatted_endpoint():
    """
    Endpoint per recuperare tutte le garanzie formattate
    
    Returns:
        List[str]: Lista di stringhe nel formato "Sezione: NOME; Garanzia: TITOLO"
    """
    try:
        return await get_all_garanzie_formatted()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/by-sezione/{sezione_nome}", response_model=List[str])
async def get_garanzie_by_sezione_formatted_endpoint(sezione_nome: str):
    """
    Endpoint per recuperare le garanzie di una specifica sezione formattate
    
    Args:
        sezione_nome (str): Nome della sezione
        
    Returns:
        List[str]: Lista di stringhe formattate per la sezione
    """
    try:
        return await get_garanzie_by_sezione_formatted(sezione_nome)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/count-by-sezione", response_model=dict)
async def get_garanzie_count_by_sezione_endpoint():
    """
    Endpoint per recuperare il conteggio delle garanzie per sezione
    
    Returns:
        dict: Dizionario con sezione come chiave e conteggio come valore
    """
    try:
        return await get_garanzie_count_by_sezione()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/export-text", response_model=str)
async def export_garanzie_formatted_to_text_endpoint():
    """
    Endpoint per esportare tutte le garanzie formattate come testo
    
    Returns:
        str: Testo con tutte le garanzie formattate
    """
    try:
        return await export_garanzie_formatted_to_text()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Example of how to add this router to your main FastAPI app:
"""
# In your main.py file:

from app.utils.example_usage import router as garanzie_formatted_router

app = FastAPI()
app.include_router(garanzie_formatted_router)

# Then you can access the endpoints at:
# GET /api/garanzie-formatted/all
# GET /api/garanzie-formatted/by-sezione/{sezione_nome}
# GET /api/garanzie-formatted/count-by-sezione
# GET /api/garanzie-formatted/export-text
"""


# Example of direct usage in Python code:
async def example_direct_usage():
    """
    Esempio di utilizzo diretto delle funzioni
    """
    print("=== ESEMPIO DI UTILIZZO DIRETTO ===\n")
    
    # 1. Recupera tutte le garanzie formattate
    print("1. Recupero tutte le garanzie formattate:")
    all_garanzie = await get_all_garanzie_formatted()
    print(f"   Trovate {len(all_garanzie)} garanzie")
    
    # Mostra i primi 3 esempi
    for i, garanzia in enumerate(all_garanzie[:3], 1):
        print(f"   {i}. {garanzia}")
    
    if len(all_garanzie) > 3:
        print(f"   ... e altre {len(all_garanzie) - 3} garanzie")
    
    print()
    
    # 2. Recupera il conteggio per sezione
    print("2. Conteggio garanzie per sezione:")
    count_by_sezione = await get_garanzie_count_by_sezione()
    
    for sezione, count in count_by_sezione.items():
        print(f"   • {sezione}: {count} garanzie")
    
    print()
    
    # 3. Recupera garanzie di una sezione specifica (se esiste)
    if count_by_sezione:
        first_sezione = list(count_by_sezione.keys())[0]
        print(f"3. Garanzie della sezione '{first_sezione}':")
        
        sezione_garanzie = await get_garanzie_by_sezione_formatted(first_sezione)
        for i, garanzia in enumerate(sezione_garanzie[:2], 1):
            print(f"   {i}. {garanzia}")
        
        if len(sezione_garanzie) > 2:
            print(f"   ... e altre {len(sezione_garanzie) - 2} garanzie")
    
    print()
    
    # 4. Esporta tutto in formato testo
    print("4. Export completo in formato testo:")
    export_text = await export_garanzie_formatted_to_text()
    
    # Mostra solo le prime righe
    lines = export_text.split('\n')
    for line in lines[:10]:
        print(f"   {line}")
    
    if len(lines) > 10:
        print(f"   ... e altre {len(lines) - 10} righe")
    
    print(f"\n   Totale caratteri nel testo: {len(export_text)}")


if __name__ == "__main__":
    import asyncio
    asyncio.run(example_direct_usage())
