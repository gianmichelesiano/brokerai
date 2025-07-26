import React from 'react'
import { View, Text } from '@react-pdf/renderer'
import { pdfStyles } from '../pdf-styles'

interface HeaderProps {
  tipologiaName: string
  generationDate: string
}

export const PDFHeader: React.FC<HeaderProps> = ({ tipologiaName, generationDate }) => {
  return (
    <View style={pdfStyles.header}>
      <Text style={pdfStyles.title}>CONFRONTO POLIZZE ASSICURATIVE</Text>
      <Text style={pdfStyles.subtitle}>{tipologiaName}</Text>
      <Text style={pdfStyles.headerInfo}>
        Documento generato il {new Date(generationDate).toLocaleString('it-IT')}
      </Text>
    </View>
  )
}