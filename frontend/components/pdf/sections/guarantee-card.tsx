import React from 'react'
import { View, Text } from '@react-pdf/renderer'
import { pdfStyles } from '../pdf-styles'

interface GuaranteeAnalysis {
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
}

interface GuaranteeCardProps {
  analisi: GuaranteeAnalysis
  index: number
}

export const PDFGuaranteeCard: React.FC<GuaranteeCardProps> = ({ analisi, index }) => {
  return (
    <View style={pdfStyles.guaranteeCard} wrap={false}>
      {/* Titolo della garanzia */}
      <Text style={pdfStyles.guaranteeTitle}>{analisi.nome_garanzia}</Text>
      
      {/* Compagnie analizzate */}
      <View style={pdfStyles.companiesSection}>
        <Text style={pdfStyles.summaryLabel}>COMPAGNIE ANALIZZATE</Text>
        <View style={pdfStyles.companiesList}>
          {analisi.compagnie_analizzate.map((compagnia, i) => (
            <Text key={i} style={pdfStyles.companyBadge}>
              {compagnia}
            </Text>
          ))}
        </View>
      </View>

      {/* Punti comuni */}
      {analisi.punti_comuni.length > 0 && (
        <View style={pdfStyles.commonPointsSection}>
          <Text style={pdfStyles.summaryLabel}>PUNTI COMUNI</Text>
          <View style={pdfStyles.commonPointsList}>
            {analisi.punti_comuni.map((punto, i) => (
              <View key={i} style={pdfStyles.commonPoint}>
                <Text style={pdfStyles.bullet}>●</Text>
                <Text style={pdfStyles.pointText}>{punto}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Confronto dettagliato */}
      {analisi.confronto_dettagliato.length > 0 && (
        <View style={pdfStyles.comparisonSection}>
          <Text style={pdfStyles.summaryLabel}>CONFRONTO DETTAGLIATO</Text>
          <View style={pdfStyles.table}>
            {/* Header della tabella */}
            <View style={pdfStyles.tableHeader}>
              <Text style={[pdfStyles.tableHeaderCell, { flex: 1.5 }]}>Aspetto</Text>
              <Text style={[pdfStyles.tableHeaderCell, { flex: 2 }]}>Compagnia</Text>
              <Text style={[pdfStyles.tableHeaderCell, { flex: 3 }]}>Clausola</Text>
            </View>
            
            {/* Righe della tabella */}
            {analisi.confronto_dettagliato.map((confronto, i) => (
              confronto.dettagli.map((dettaglio, j) => (
                <View key={`${i}-${j}`} style={pdfStyles.tableRow}>
                  <View style={[pdfStyles.tableCell, { flex: 1.5 }]}>
                    {j === 0 && (
                      <Text style={pdfStyles.aspectTitle}>{confronto.aspetto}</Text>
                    )}
                  </View>
                  <View style={[pdfStyles.tableCell, { flex: 2 }]}>
                    <Text style={pdfStyles.companyBadge}>{dettaglio.compagnia}</Text>
                  </View>
                  <View style={[pdfStyles.tableCell, { flex: 3 }]}>
                    <Text style={pdfStyles.clauseText}>{dettaglio.clausola}</Text>
                  </View>
                </View>
              ))
            ))}
          </View>
        </View>
      )}

      {/* Principali differenze */}
      {analisi.riepilogo_principali_differenze.length > 0 && (
        <View style={pdfStyles.differencesSection}>
          <Text style={pdfStyles.summaryLabel}>PRINCIPALI DIFFERENZE</Text>
          <View style={pdfStyles.differencesList}>
            {analisi.riepilogo_principali_differenze.map((differenza, i) => (
              <View key={i} style={pdfStyles.difference}>
                <Text style={pdfStyles.differenceBullet}>▲</Text>
                <Text style={pdfStyles.differenceText}>{differenza}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  )
}