import React from 'react'
import { Document, Page, View } from '@react-pdf/renderer'
import { pdfStyles } from './pdf-styles'
import { PDFHeader } from './sections/header'
import { PDFSummary } from './sections/summary'
import { PDFGuaranteeCard } from './sections/guarantee-card'
import { PDFFooter } from './sections/footer'

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

interface PDFTemplateProps {
  risultati: ConfrontoRisultato
  tipologiaName: string
  compagnieNames: string[]
  garanzieNames: string[]
}

export const PDFTemplate: React.FC<PDFTemplateProps> = ({
  risultati,
  tipologiaName,
  compagnieNames,
  garanzieNames
}) => {
  const generationDate = new Date().toISOString()

  return (
    <Document
      title={`Confronto Polizze - ${tipologiaName}`}
      author="BrokerAI"
      subject="Confronto Polizze Assicurative"
      creator="BrokerAI Platform"
    >
      {/* Prima pagina: Header + Riepilogo */}
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.contentContainer}>
          <PDFHeader 
            tipologiaName={tipologiaName}
            generationDate={generationDate}
          />
          
          <PDFSummary
            tipologiaName={tipologiaName}
            compagnieNames={compagnieNames}
            garanzieNames={garanzieNames}
            totalAnalisi={risultati.risultati_analisi.length}
          />

          {/* Prima garanzia se c'è spazio */}
          {risultati.risultati_analisi.length > 0 && (
            <PDFGuaranteeCard
              analisi={risultati.risultati_analisi[0]}
              index={0}
            />
          )}
        </View>

        <PDFFooter generationDate={generationDate} />
      </Page>

      {/* Pagine successive per le altre garanzie */}
      {risultati.risultati_analisi.slice(1).map((analisi, index) => (
        <Page key={index + 1} size="A4" style={pdfStyles.page}>
          <View style={pdfStyles.contentContainer}>
            <PDFGuaranteeCard
              analisi={analisi}
              index={index + 1}
            />
          </View>
          <PDFFooter generationDate={generationDate} />
        </Page>
      ))}
    </Document>
  )
}