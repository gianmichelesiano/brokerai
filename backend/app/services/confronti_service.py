import os
import json
import logging
from typing import List, Dict, Optional
from openai import OpenAI
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

class AnalizzatorePolizze:
    """
    Classe semplice per analizzare e confrontare polizze assicurative
    """
    
    def __init__(self):
        try:
            api_key = os.getenv('OPENAI_API_KEY')
            if not api_key:
                raise ValueError("OPENAI_API_KEY non trovata nelle variabili d'ambiente")
            
            self.client = OpenAI(api_key=api_key)
            logger.info("AnalizzatorePolizze inizializzato")
            
        except Exception as e:
            logger.error(f"Errore inizializzazione: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Errore nell'inizializzazione del servizio di analisi"
            )

    def analizza_garanzie(self, nome_garanzia: str, polizze: List[Dict]) -> Dict:
        """
        Analizza e confronta i testi delle polizze per una garanzia specifica
        
        Args:
            nome_garanzia: Nome della garanzia da analizzare
            polizze: Lista di dict con 'compagnia' e 'testo'
            
        Returns:
            Dict con l'analisi strutturata
        """
        if len(polizze) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Sono necessarie almeno 2 polizze per il confronto"
            )
        
        try:
            # Costruisce il prompt con i testi delle polizze
            testi_formattati = []
            for polizza in polizze:
                testi_formattati.append(
                    f"--- COMPAGNIA: {polizza['compagnia']} ---\n{polizza['testo']}\n"
                )
            
            testi_polizze_str = "\n".join(testi_formattati)
            
            prompt = f"""
Analizza e confronta i seguenti testi di polizze assicurative per la garanzia "{nome_garanzia}".

{testi_polizze_str}

Fornisci un'analisi strutturata in formato JSON con questa struttura:
{{
  "nome_garanzia": "Nome della garanzia",
  "compagnie_analizzate": ["Nome1", "Nome2"],
  "punti_comuni": ["Punto comune 1", "Punto comune 2"],
  "confronto_dettagliato": [
    {{
      "aspetto": "Nome aspetto (es: Limite di Rimborso)",
      "dettagli": [
        {{
          "compagnia": "Nome Compagnia",
          "clausola": "Descrizione della clausola"
        }}
      ]
    }}
  ],
  "riepilogo_principali_differenze": ["Differenza 1", "Differenza 2"]
}}

Concentrati su: limiti di rimborso, franchigie, condizioni di attivazione, esclusioni, coperture specifiche.
"""
            
            # Chiamata a OpenAI
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "Sei un esperto analista di polizze assicurative. Fornisci sempre risposte in formato JSON valido."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.1,
                max_tokens=3000,
                response_format={"type": "json_object"}
            )
            
            # Parsing della risposta
            content = response.choices[0].message.content.strip()
            result = json.loads(content)
            
            logger.info(f"Analisi completata per garanzia: {nome_garanzia}")
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"Errore parsing JSON: {e}")
            # Fallback response
            return {
                "nome_garanzia": nome_garanzia,
                "compagnie_analizzate": [p['compagnia'] for p in polizze],
                "punti_comuni": ["Errore nel parsing della risposta AI"],
                "confronto_dettagliato": [],
                "riepilogo_principali_differenze": ["Impossibile analizzare le differenze"],
                "errore": str(e)
            }
            
        except Exception as e:
            logger.error(f"Errore durante l'analisi: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Errore durante l'analisi: {str(e)}"
            )