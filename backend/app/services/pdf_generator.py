"""
Servizio per la generazione di PDF server-side usando Puppeteer e template HTML
"""

import asyncio
import os
import tempfile
from datetime import datetime
from typing import Dict, List, Any, Optional
from jinja2 import Template
from playwright.async_api import async_playwright
import logging

logger = logging.getLogger(__name__)

class PDFGeneratorService:
    def __init__(self):
        self.template_dir = os.path.join(os.path.dirname(__file__), '..', 'templates', 'pdf')
        
    async def generate_confronto_pdf(
        self,
        confronto_data: Dict[str, Any],
        tipologia_nome: str,
        compagnie_nomi: List[str],
        garanzie_nomi: List[str]
    ) -> bytes:
        """
        Genera un PDF del confronto usando template HTML
        """
        try:
            # Prepara i dati per il template
            template_data = {
                'tipologia_nome': tipologia_nome,
                'compagnie_nomi': compagnie_nomi,
                'garanzie_nomi': garanzie_nomi,
                'risultati_analisi': confronto_data.get('risultati_analisi', []),
                'timestamp': confronto_data.get('timestamp', datetime.now().isoformat()),
                'data_generazione': datetime.now().strftime('%d/%m/%Y alle %H:%M'),
                'total_analisi': len(confronto_data.get('risultati_analisi', [])),
                'total_compagnie': len(compagnie_nomi),
                'total_garanzie': len(garanzie_nomi)
            }
            
            # Carica e renderizza il template HTML
            html_content = self._render_html_template(template_data)
            
            # Genera il PDF usando Puppeteer
            pdf_bytes = await self._generate_pdf_from_html(html_content)
            
            return pdf_bytes
            
        except Exception as e:
            logger.error(f"Errore nella generazione PDF: {e}")
            raise Exception(f"Errore nella generazione PDF: {str(e)}")
    
    def _render_html_template(self, data: Dict[str, Any]) -> str:
        """
        Renderizza il template HTML con i dati del confronto
        """
        template_html = """
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confronto Polizze - {{ tipologia_nome }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            background: white;
        }
        
        .page {
            width: 210mm;
            min-height: 297mm;
            padding: 20mm;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 5px rgba(0,0,0,0.1);
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 15px;
        }
        
        .header h1 {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 8px;
        }
        
        .header .subtitle {
            font-size: 16px;
            color: #64748b;
            margin-bottom: 5px;
        }
        
        .header .date {
            font-size: 12px;
            color: #64748b;
        }
        
        .summary {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border: 1px solid #e2e8f0;
        }
        
        .summary h2 {
            font-size: 16px;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 15px;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
        }
        
        .summary-item {
            display: flex;
            flex-direction: column;
        }
        
        .summary-label {
            font-size: 10px;
            font-weight: bold;
            color: #64748b;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        
        .summary-value {
            font-size: 12px;
            color: #1e293b;
        }
        
        .badges {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
        }
        
        .badge {
            background: #dbeafe;
            color: #1e40af;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
        }
        
        .guarantee-section {
            margin-bottom: 40px;
            page-break-inside: avoid;
        }
        
        .guarantee-title {
            font-size: 18px;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e2e8f0;
        }
        
        .guarantee-companies {
            margin-bottom: 20px;
        }
        
        .section-title {
            font-size: 13px;
            font-weight: bold;
            color: #475569;
            margin-bottom: 10px;
            text-transform: uppercase;
        }
        
        .common-points, .differences {
            margin-bottom: 20px;
        }
        
        .point-list {
            margin: 0;
            padding-left: 20px;
        }
        
        .point-list li {
            margin-bottom: 8px;
            line-height: 1.5;
        }
        
        .common-points .point-list li::marker {
            color: #16a34a;
        }
        
        .differences .point-list li::marker {
            color: #dc2626;
        }
        
        .comparison-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 11px;
        }
        
        .comparison-table th {
            background: #f1f5f9;
            color: #475569;
            font-weight: bold;
            padding: 12px 8px;
            text-align: left;
            border: 1px solid #e2e8f0;
        }
        
        .comparison-table td {
            padding: 10px 8px;
            border: 1px solid #e2e8f0;
            vertical-align: top;
        }
        
        .comparison-table tr:nth-child(even) {
            background: #f9fafb;
        }
        
        .aspect-title {
            font-weight: bold;
            color: #374151;
            margin-bottom: 5px;
        }
        
        .company-name {
            background: #dbeafe;
            color: #1e40af;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: bold;
            display: inline-block;
            margin-bottom: 5px;
        }
        
        .footer {
            position: fixed;
            bottom: 15mm;
            left: 20mm;
            right: 20mm;
            text-align: center;
            font-size: 10px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
        }
        
        .page-break {
            page-break-before: always;
        }
        
        @media print {
            .page {
                box-shadow: none;
                margin: 0;
            }
        }
    </style>
</head>
<body>
    <div class="page">
        <!-- Header -->
        <div class="header">
            <h1>CONFRONTO POLIZZE ASSICURATIVE</h1>
            <div class="subtitle">{{ tipologia_nome }}</div>
            <div class="date">Documento generato il {{ data_generazione }}</div>
        </div>
        
        <!-- Summary -->
        <div class="summary">
            <h2>Riepilogo Generale</h2>
            <div class="summary-grid">
                <div class="summary-item">
                    <div class="summary-label">Tipologia Assicurativa</div>
                    <div class="summary-value">{{ tipologia_nome }}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Numero Analisi</div>
                    <div class="summary-value">{{ total_analisi }}</div>
                </div>
            </div>
            <div class="summary-grid">
                <div class="summary-item">
                    <div class="summary-label">Compagnie Analizzate ({{ total_compagnie }})</div>
                    <div class="summary-value">
                        <div class="badges">
                            {% for compagnia in compagnie_nomi %}
                            <span class="badge">{{ compagnia }}</span>
                            {% endfor %}
                        </div>
                    </div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Garanzie Confrontate ({{ total_garanzie }})</div>
                    <div class="summary-value">
                        <div class="badges">
                            {% for garanzia in garanzie_nomi %}
                            <span class="badge">{{ garanzia }}</span>
                            {% endfor %}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Guarantee Sections -->
        {% for analisi in risultati_analisi %}
        <div class="guarantee-section {% if loop.index > 1 %}page-break{% endif %}">
            <h2 class="guarantee-title">{{ analisi.nome_garanzia }}</h2>
            
            <!-- Companies Analyzed -->
            <div class="guarantee-companies">
                <div class="section-title">Compagnie Analizzate</div>
                <div class="badges">
                    {% for compagnia in analisi.compagnie_analizzate %}
                    <span class="badge">{{ compagnia }}</span>
                    {% endfor %}
                </div>
            </div>
            
            <!-- Common Points -->
            {% if analisi.punti_comuni %}
            <div class="common-points">
                <div class="section-title">✓ Punti Comuni</div>
                <ul class="point-list">
                    {% for punto in analisi.punti_comuni %}
                    <li>{{ punto }}</li>
                    {% endfor %}
                </ul>
            </div>
            {% endif %}
            
            <!-- Detailed Comparison -->
            {% if analisi.confronto_dettagliato %}
            <div class="comparison-section">
                <div class="section-title">Confronto Dettagliato</div>
                <table class="comparison-table">
                    <thead>
                        <tr>
                            <th style="width: 25%;">Aspetto</th>
                            <th style="width: 20%;">Compagnia</th>
                            <th style="width: 55%;">Clausola</th>
                        </tr>
                    </thead>
                    <tbody>
                        {% for confronto in analisi.confronto_dettagliato %}
                            {% for dettaglio in confronto.dettagli %}
                            <tr>
                                {% if loop.index == 1 %}
                                <td rowspan="{{ confronto.dettagli|length }}">
                                    <div class="aspect-title">{{ confronto.aspetto }}</div>
                                </td>
                                {% endif %}
                                <td>
                                    <span class="company-name">{{ dettaglio.compagnia }}</span>
                                </td>
                                <td>{{ dettaglio.clausola }}</td>
                            </tr>
                            {% endfor %}
                        {% endfor %}
                    </tbody>
                </table>
            </div>
            {% endif %}
            
            <!-- Main Differences -->
            {% if analisi.riepilogo_principali_differenze %}
            <div class="differences">
                <div class="section-title">⚠ Principali Differenze</div>
                <ul class="point-list">
                    {% for differenza in analisi.riepilogo_principali_differenze %}
                    <li>{{ differenza }}</li>
                    {% endfor %}
                </ul>
            </div>
            {% endif %}
        </div>
        {% endfor %}
    </div>
    
    <!-- Footer -->
    <div class="footer">
        <div>Documento generato il {{ data_generazione }} - BrokerAI</div>
        <div>I dati contenuti in questo documento sono estratti dalle polizze assicurative analizzate tramite intelligenza artificiale.</div>
        <div>Questo documento è generato automaticamente e ha valore puramente informativo.</div>
    </div>
</body>
</html>
        """
        
        template = Template(template_html)
        return template.render(**data)
    
    async def _generate_pdf_from_html(self, html_content: str) -> bytes:
        """
        Genera PDF da contenuto HTML usando Playwright
        """
        async with async_playwright() as p:
            try:
                # Lancia browser headless
                browser = await p.chromium.launch(
                    headless=True,
                    args=[
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-gpu'
                    ]
                )
                
                page = await browser.new_page()
                
                # Carica il contenuto HTML
                await page.set_content(html_content)
                
                # Genera PDF
                pdf_bytes = await page.pdf(
                    format='A4',
                    margin={
                        'top': '15mm',
                        'right': '15mm', 
                        'bottom': '20mm',
                        'left': '15mm'
                    },
                    print_background=True,
                    display_header_footer=False
                )
                
                await browser.close()
                return pdf_bytes
                
            except Exception as e:
                logger.error(f"Errore nella generazione PDF con Playwright: {e}")
                raise

# Istanza globale del servizio
pdf_service = PDFGeneratorService()