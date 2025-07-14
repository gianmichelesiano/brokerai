"""
AI Analyzer service for OpenAI integration and policy analysis
"""

import json
import logging
import asyncio
import time
from typing import Dict, List, Optional, Any, Tuple
from openai import AsyncOpenAI
from app.config.settings import settings
from app.utils.exceptions import AIServiceError, raise_ai_service_error

logger = logging.getLogger(__name__)


class AIAnalyzerService:
    """Service for AI-powered policy analysis using OpenAI"""
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL
        self.max_tokens = settings.OPENAI_MAX_TOKENS
        self.temperature = settings.OPENAI_TEMPERATURE
        self.retry_attempts = settings.AI_RETRY_ATTEMPTS
        self.retry_delay = settings.AI_RETRY_DELAY
    
    async def analyze_guarantee(
        self, 
        polizza_text: str, 
        garanzia: Dict[str, str],
        custom_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Analyze a single guarantee in the policy text
        
        Args:
            polizza_text: Full policy text
            garanzia: Dictionary with garanzia info (titolo, sezione, descrizione)
            custom_prompt: Optional custom prompt override
            
        Returns:
            Dict with analysis results
        """
        try:
            start_time = time.time()
            
            # Build the analysis prompt
            prompt = custom_prompt or self._build_guarantee_analysis_prompt(polizza_text, garanzia)
            
            # Make API call with retry logic
            response = await self._make_api_call_with_retry(prompt)
            
            analysis_time = time.time() - start_time
            
            # Parse and validate response
            result = self._parse_guarantee_response(response, analysis_time)
            
            logger.info(
                f"Analyzed guarantee '{garanzia['titolo']}' in {analysis_time:.2f}s "
                f"- Found: {result.get('found', False)}"
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Error analyzing guarantee '{garanzia['titolo']}': {e}")
            return {
                'success': False,
                'error': str(e),
                'ref_number': None,
                'title': None,
                'content': None,
                'confidence': 0.0,
                'found': False,
                'analysis_time': 0.0,
                'raw_response': None
            }
    
    async def compare_guarantees(
        self, 
        garanzia_nome: str, 
        polizze_data: List[Dict[str, str]],
        custom_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Compare a guarantee across multiple companies
        
        Args:
            garanzia_nome: Name of the guarantee to compare
            polizze_data: List of dicts with 'compagnia' and 'contenuto' keys
            custom_prompt: Optional custom prompt override
            
        Returns:
            Dict with comparison results
        """
        try:
            start_time = time.time()
            
            # Build comparison prompt
            prompt = custom_prompt or self._build_comparison_prompt(garanzia_nome, polizze_data)
            
            # Make API call with retry logic
            response = await self._make_api_call_with_retry(prompt, max_tokens=self.max_tokens + 500)
            
            analysis_time = time.time() - start_time
            
            # Parse and validate response
            result = self._parse_comparison_response(response, garanzia_nome, polizze_data, analysis_time)
            
            logger.info(
                f"Compared guarantee '{garanzia_nome}' across {len(polizze_data)} companies "
                f"in {analysis_time:.2f}s"
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Error comparing guarantee '{garanzia_nome}': {e}")
            return {
                'error': str(e),
                'nome_garanzia': garanzia_nome,
                'compagnie_analizzate': [p['compagnia'] for p in polizze_data],
                'punti_comuni': [],
                'confronto_dettagliato': [],
                'riepilogo_principali_differenze': [f"Errore nell'analisi: {str(e)}"],
                'confidence': 0.0,
                'analysis_time': 0.0
            }
    
    async def batch_analyze_guarantees(
        self,
        polizza_text: str,
        garanzie: List[Dict[str, str]],
        batch_size: int = 5,
        progress_callback: Optional[callable] = None
    ) -> List[Dict[str, Any]]:
        """
        Analyze multiple guarantees in batches
        
        Args:
            polizza_text: Full policy text
            garanzie: List of guarantee dictionaries
            batch_size: Number of guarantees to process in parallel
            progress_callback: Optional callback for progress updates
            
        Returns:
            List of analysis results
        """
        results = []
        total = len(garanzie)
        
        logger.info(f"Starting batch analysis of {total} guarantees with batch size {batch_size}")
        
        for i in range(0, total, batch_size):
            batch = garanzie[i:i + batch_size]
            batch_start = time.time()
            
            # Process batch in parallel
            tasks = [
                self.analyze_guarantee(polizza_text, garanzia)
                for garanzia in batch
            ]
            
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Handle exceptions in batch results
            for j, result in enumerate(batch_results):
                if isinstance(result, Exception):
                    logger.error(f"Exception in batch analysis: {result}")
                    results.append({
                        'success': False,
                        'error': str(result),
                        'garanzia_id': batch[j].get('id'),
                        'found': False,
                        'confidence': 0.0
                    })
                else:
                    results.append(result)
            
            batch_time = time.time() - batch_start
            processed = min(i + batch_size, total)
            
            logger.info(
                f"Processed batch {i//batch_size + 1}: {len(batch)} guarantees "
                f"in {batch_time:.2f}s ({processed}/{total} total)"
            )
            
            # Call progress callback if provided
            if progress_callback:
                try:
                    await progress_callback(processed, total, batch_results)
                except Exception as e:
                    logger.warning(f"Progress callback error: {e}")
            
            # Add delay between batches to respect rate limits
            if i + batch_size < total:
                await asyncio.sleep(self.retry_delay)
        
        logger.info(f"Completed batch analysis: {len(results)} results")
        return results
    
    async def _make_api_call_with_retry(
        self, 
        prompt: str, 
        max_tokens: Optional[int] = None
    ) -> str:
        """Make OpenAI API call with retry logic"""
        
        max_tokens = max_tokens or self.max_tokens
        
        for attempt in range(self.retry_attempts):
            try:
                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {
                            "role": "system",
                            "content": "Sei un esperto di polizze assicurative. Analizza il documento e restituisci sempre un JSON valido."
                        },
                        {
                            "role": "user", 
                            "content": prompt
                        }
                    ],
                    temperature=self.temperature,
                    max_tokens=max_tokens,
                    timeout=60.0
                )
                
                content = response.choices[0].message.content.strip()
                return content
                
            except Exception as e:
                logger.warning(f"API call attempt {attempt + 1} failed: {e}")
                
                if attempt < self.retry_attempts - 1:
                    wait_time = self.retry_delay * (2 ** attempt)  # Exponential backoff
                    logger.info(f"Retrying in {wait_time}s...")
                    await asyncio.sleep(wait_time)
                else:
                    raise AIServiceError(f"API call failed after {self.retry_attempts} attempts: {str(e)}")
    
    def _build_guarantee_analysis_prompt(self, polizza_text: str, garanzia: Dict[str, str]) -> str:
        """Build prompt for single guarantee analysis"""
        
        # Truncate text if too long to fit in context
        max_text_length = 8000  # Leave room for prompt and response
        if len(polizza_text) > max_text_length:
            polizza_text = polizza_text[:max_text_length] + "...[TESTO TRONCATO]"
        
        prompt = f"""
Sei un esperto in assicurazioni.

**Documento da analizzare:**
{polizza_text}

**Garanzia da cercare:**
- Sezione: {garanzia.get('sezione') or garanzia.get('sezione_nome', 'N/A')}
- Titolo: {garanzia['titolo']}
- Descrizione: {garanzia['descrizione']}

**Istruzioni:**
Ricerca se esiste la garanzia "{garanzia['titolo']}" nella sezione "{garanzia.get('sezione') or garanzia.get('sezione_nome', 'N/A')}" con descrizione: "{garanzia['descrizione']}".

Se non trovi la garanzia, ritorna "NON PREVISTA" nel campo content.

**Formato di output richiesto:**
Restituisci SOLO un oggetto JSON con questa struttura esatta:
{{
  "ref_number": "numero_sezione_o_articolo_se_trovato",
  "title": "titolo_esatto_trovato_nel_documento", 
  "content": "contenuto_estratto_o_NON_PREVISTA",
  "confidence": 0.95
}}

Il campo confidence deve essere un numero tra 0 e 1 che indica quanto sei sicuro del risultato.
"""
        return prompt
    
    def _build_comparison_prompt(self, garanzia_nome: str, polizze_data: List[Dict[str, str]]) -> str:
        """Build prompt for guarantee comparison"""
        
        # Build companies text
        polizze_text = "\n\n".join([
            f"**{p['compagnia']}:**\n{p['contenuto'][:2000]}{'...' if len(p['contenuto']) > 2000 else ''}" 
            for p in polizze_data
        ])
        
        prompt = f"""
Analizza e confronta la garanzia "{garanzia_nome}" tra le seguenti compagnie:

{polizze_text}

**Istruzioni:**
Fornisci un'analisi strutturata che confronti come ogni compagnia copre questa garanzia.

**Formato di output richiesto:**
Restituisci SOLO un oggetto JSON con questa struttura esatta:
{{
  "nome_garanzia": "{garanzia_nome}",
  "compagnie_analizzate": {[f'"{p["compagnia"]}"' for p in polizze_data]},
  "punti_comuni": ["punto1", "punto2"],
  "confronto_dettagliato": [
    {{
      "aspetto": "Massimale",
      "dettagli": [
        {{"compagnia": "Compagnia1", "clausola": "dettaglio"}},
        {{"compagnia": "Compagnia2", "clausola": "dettaglio"}}
      ]
    }}
  ],
  "riepilogo_principali_differenze": ["differenza1", "differenza2"],
  "confidence": 0.95
}}

Analizza aspetti come: massimali, franchigie, esclusioni, condizioni particolari, modalità di rimborso.
"""
        return prompt
    
    def _parse_guarantee_response(self, response: str, analysis_time: float) -> Dict[str, Any]:
        """Parse and validate guarantee analysis response"""
        try:
            # Clean response
            content = self._clean_json_response(response)
            
            # Parse JSON
            json_response = json.loads(content)
            
            # Validate required fields
            required_fields = ['ref_number', 'title', 'content', 'confidence']
            for field in required_fields:
                if field not in json_response:
                    json_response[field] = None
            
            # Determine if guarantee was found
            found = (
                json_response.get('content', '').upper() != 'NON PREVISTA' and
                json_response.get('content') is not None and
                json_response.get('content').strip() != ''
            )
            
            # Validate confidence
            confidence = json_response.get('confidence', 0.0)
            if not isinstance(confidence, (int, float)) or confidence < 0 or confidence > 1:
                confidence = 0.5  # Default confidence
            
            return {
                'success': True,
                'ref_number': json_response.get('ref_number'),
                'title': json_response.get('title'),
                'content': json_response.get('content'),
                'confidence': float(confidence),
                'found': found,
                'analysis_time': analysis_time,
                'raw_response': content
            }
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {e}")
            logger.error(f"Response content: {response}")
            
            return {
                'success': False,
                'error': f"Risposta AI non valida: {str(e)}",
                'ref_number': None,
                'title': None,
                'content': None,
                'confidence': 0.0,
                'found': False,
                'analysis_time': analysis_time,
                'raw_response': response
            }
        
        except Exception as e:
            logger.error(f"Error parsing guarantee response: {e}")
            
            return {
                'success': False,
                'error': str(e),
                'ref_number': None,
                'title': None,
                'content': None,
                'confidence': 0.0,
                'found': False,
                'analysis_time': analysis_time,
                'raw_response': response
            }
    
    def _parse_comparison_response(
        self, 
        response: str, 
        garanzia_nome: str, 
        polizze_data: List[Dict[str, str]], 
        analysis_time: float
    ) -> Dict[str, Any]:
        """Parse and validate comparison response"""
        try:
            # Clean response
            content = self._clean_json_response(response)
            
            # Parse JSON
            json_response = json.loads(content)
            
            # Validate and set defaults
            result = {
                'nome_garanzia': json_response.get('nome_garanzia', garanzia_nome),
                'compagnie_analizzate': json_response.get('compagnie_analizzate', [p['compagnia'] for p in polizze_data]),
                'punti_comuni': json_response.get('punti_comuni', []),
                'confronto_dettagliato': json_response.get('confronto_dettagliato', []),
                'riepilogo_principali_differenze': json_response.get('riepilogo_principali_differenze', []),
                'confidence': float(json_response.get('confidence', 0.5)),
                'analysis_time': analysis_time,
                'raw_response': content
            }
            
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error in comparison: {e}")
            logger.error(f"Response content: {response}")
            
            return {
                'error': f"Risposta AI non valida: {str(e)}",
                'nome_garanzia': garanzia_nome,
                'compagnie_analizzate': [p['compagnia'] for p in polizze_data],
                'punti_comuni': [],
                'confronto_dettagliato': [],
                'riepilogo_principali_differenze': [f"Errore nel parsing della risposta: {str(e)}"],
                'confidence': 0.0,
                'analysis_time': analysis_time,
                'raw_response': response
            }
        
        except Exception as e:
            logger.error(f"Error parsing comparison response: {e}")
            
            return {
                'error': str(e),
                'nome_garanzia': garanzia_nome,
                'compagnie_analizzate': [p['compagnia'] for p in polizze_data],
                'punti_comuni': [],
                'confronto_dettagliato': [],
                'riepilogo_principali_differenze': [f"Errore nell'analisi: {str(e)}"],
                'confidence': 0.0,
                'analysis_time': analysis_time,
                'raw_response': response
            }
    
    def _clean_json_response(self, response: str) -> str:
        """Clean and extract JSON from AI response"""
        content = response.strip()
        
        # Remove markdown code blocks
        if content.startswith('```json'):
            content = content.replace('```json', '').replace('```', '').strip()
        elif content.startswith('```'):
            content = content.replace('```', '').strip()
        
        # Find JSON object boundaries
        start_idx = content.find('{')
        end_idx = content.rfind('}')
        
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            content = content[start_idx:end_idx + 1]
        
        return content
    
    async def test_connection(self) -> Dict[str, Any]:
        """Test OpenAI API connection"""
        try:
            start_time = time.time()
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "user",
                        "content": "Rispondi con un semplice 'OK' per testare la connessione."
                    }
                ],
                max_tokens=10,
                temperature=0
            )
            
            response_time = time.time() - start_time
            content = response.choices[0].message.content.strip()
            
            return {
                "success": True,
                "response_time": response_time,
                "model": self.model,
                "response": content
            }
            
        except Exception as e:
            logger.error(f"OpenAI connection test failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "model": self.model
            }
    
    def get_usage_stats(self) -> Dict[str, Any]:
        """Get service usage statistics"""
        return {
            "model": self.model,
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
            "retry_attempts": self.retry_attempts,
            "retry_delay": self.retry_delay
        }


# Global instance
ai_analyzer = AIAnalyzerService()
