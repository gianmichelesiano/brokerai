import React from 'react'
import { View, Text } from '@react-pdf/renderer'
import { pdfStyles } from '../pdf-styles'

interface FooterProps {
  generationDate: string
}

export const PDFFooter: React.FC<FooterProps> = ({ generationDate }) => {
  return (
    <View style={pdfStyles.footer} fixed>
      <Text style={pdfStyles.footerText}>
        Documento generato il {new Date(generationDate).toLocaleString('it-IT')} - BrokerAI
      </Text>
      <Text style={pdfStyles.footerText}>
        I dati contenuti in questo documento sono estratti dalle polizze assicurative analizzate tramite intelligenza artificiale.
      </Text>
      <Text style={pdfStyles.footerText}>
        Questo documento è generato automaticamente e ha valore puramente informativo.
      </Text>
    </View>
  )
}