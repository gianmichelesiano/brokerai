import { pdf } from '@react-pdf/renderer'
import { PDFTemplate } from './pdf-template'

interface ConfrontoRisultato {
  risultati_analisi: Array<{
    nome_garanzia: string
    compagnie_analizzate: string[]
    punti_comuni: string[]
    confronto_dettagliato: Array<{
      aspetto: string
      dettagli: Array<{
        compagnia: string
        clausola: string
      }>
    }>
    riepilogo_principali_differenze: string[]
  }>
  timestamp: string
}

interface GeneratePDFOptions {
  risultati: ConfrontoRisultato
  tipologiaName: string
  compagnieNames: string[]
  garanzieNames: string[]
}

export const generateConfrontoPDF = async (options: GeneratePDFOptions): Promise<Blob> => {
  try {
    const { risultati, tipologiaName, compagnieNames, garanzieNames } = options

    // Validate input data
    if (!risultati || !risultati.risultati_analisi || risultati.risultati_analisi.length === 0) {
      throw new Error('Nessun risultato di confronto disponibile per l\'export')
    }

    if (!tipologiaName) {
      throw new Error('Tipologia assicurativa non specificata')
    }

    if (!compagnieNames || compagnieNames.length === 0) {
      throw new Error('Nessuna compagnia selezionata')
    }

    if (!garanzieNames || garanzieNames.length === 0) {
      throw new Error('Nessuna garanzia selezionata')
    }

    // Generate PDF
    const pdfBlob = await pdf(
      PDFTemplate({
        risultati,
        tipologiaName,
        compagnieNames,
        garanzieNames
      })
    ).toBlob()

    return pdfBlob
  } catch (error) {
    console.error('Errore durante la generazione del PDF:', error)
    throw new Error(`Errore durante la generazione del PDF: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`)
  }
}

export const downloadPDF = (blob: Blob, filename?: string) => {
  try {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    
    // Generate filename if not provided
    const timestamp = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    const defaultFilename = `confronto-polizze-${timestamp}.pdf`
    link.download = filename || defaultFilename
    
    // Trigger download
    document.body.appendChild(link)
    link.click()
    
    // Cleanup
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Errore durante il download del PDF:', error)
    throw new Error('Errore durante il download del PDF')
  }
}

// Utility function to format filename
export const generatePDFFilename = (tipologiaName: string): string => {
  const timestamp = new Date().toISOString().split('T')[0]
  const sanitizedTipologia = tipologiaName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  
  return `confronto-${sanitizedTipologia}-${timestamp}.pdf`
}