import React from 'react'
import { View, Text } from '@react-pdf/renderer'
import { pdfStyles } from '../pdf-styles'

interface SummaryProps {
  tipologiaName: string
  compagnieNames: string[]
  garanzieNames: string[]
  totalAnalisi: number
}

export const PDFSummary: React.FC<SummaryProps> = ({ 
  tipologiaName, 
  compagnieNames, 
  garanzieNames, 
  totalAnalisi 
}) => {
  return (
    <View style={pdfStyles.summarySection}>
      <Text style={pdfStyles.sectionTitle}>Riepilogo Generale</Text>
      
      <View style={pdfStyles.summaryGrid}>
        <View style={pdfStyles.summaryItem}>
          <Text style={pdfStyles.summaryLabel}>TIPOLOGIA ASSICURATIVA</Text>
          <Text style={pdfStyles.summaryValue}>{tipologiaName}</Text>
        </View>
        
        <View style={pdfStyles.summaryItem}>
          <Text style={pdfStyles.summaryLabel}>NUMERO ANALISI</Text>
          <Text style={pdfStyles.summaryValue}>{totalAnalisi}</Text>
        </View>
      </View>

      <View style={pdfStyles.summaryGrid}>
        <View style={pdfStyles.summaryItem}>
          <Text style={pdfStyles.summaryLabel}>COMPAGNIE ANALIZZATE ({compagnieNames.length})</Text>
          <Text style={pdfStyles.summaryValue}>
            {compagnieNames.join(', ')}
          </Text>
        </View>
      </View>

      <View style={pdfStyles.summaryGrid}>
        <View style={pdfStyles.summaryItem}>
          <Text style={pdfStyles.summaryLabel}>GARANZIE CONFRONTATE ({garanzieNames.length})</Text>
          <Text style={pdfStyles.summaryValue}>
            {garanzieNames.join(', ')}
          </Text>
        </View>
      </View>
    </View>
  )
}