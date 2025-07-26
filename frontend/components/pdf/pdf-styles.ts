import { StyleSheet } from '@react-pdf/renderer'

export const pdfStyles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 30,
    paddingLeft: 60,
    paddingRight: 60,
    paddingBottom: 80, // Spazio per il footer
    lineHeight: 1.5,
    color: '#333333'
  },
  
  // Content container
  contentContainer: {
    flex: 1,
    marginBottom: 10 // Spazio aggiuntivo prima del footer
  },
  
  // Header styles
  header: {
    marginBottom: 30,
    borderBottom: '2px solid #2563eb',
    paddingBottom: 15
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2563eb',
    marginBottom: 5
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    color: '#64748b',
    marginBottom: 10
  },
  headerInfo: {
    fontSize: 10,
    textAlign: 'center',
    color: '#64748b'
  },

  // Summary styles
  summarySection: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#f8fafc',
    borderRadius: 5
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 10
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  summaryItem: {
    flex: 1,
    marginRight: 15
  },
  summaryLabel: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 3,
    fontWeight: 'bold'
  },
  summaryValue: {
    fontSize: 10,
    color: '#1e293b'
  },

  // Guarantee card styles
  guaranteeCard: {
    marginBottom: 20,
    border: '1px solid #e2e8f0',
    borderRadius: 5,
    padding: 15,
    minHeight: 200 // Minima altezza per evitare contenuto troppo compresso
  },
  guaranteeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: 5
  },
  guaranteeSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 10
  },

  // Companies section
  companiesSection: {
    marginBottom: 15
  },
  companiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5
  },
  companyBadge: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    padding: '3 8',
    borderRadius: 3,
    fontSize: 9,
    fontWeight: 'bold'
  },

  // Common points section
  commonPointsSection: {
    marginBottom: 15
  },
  commonPointsList: {
    marginLeft: 10
  },
  commonPoint: {
    flexDirection: 'row',
    marginBottom: 5,
    alignItems: 'flex-start'
  },
  bullet: {
    fontSize: 8,
    color: '#16a34a',
    marginRight: 8,
    marginTop: 2
  },
  pointText: {
    fontSize: 9,
    color: '#1e293b',
    flex: 1,
    lineHeight: 1.4
  },

  // Detailed comparison table
  comparisonSection: {
    marginBottom: 15
  },
  table: {
    border: '1px solid #e2e8f0',
    borderRadius: 3
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottom: '1px solid #e2e8f0',
    padding: 8
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#475569',
    flex: 1,
    textAlign: 'center'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #f1f5f9',
    padding: 8,
    minHeight: 35
  },
  tableCell: {
    fontSize: 8,
    color: '#1e293b',
    flex: 1,
    paddingRight: 5,
    alignItems: 'flex-start'
  },
  aspectTitle: {
    fontWeight: 'bold',
    marginBottom: 3,
    color: '#475569'
  },
  clauseText: {
    lineHeight: 1.3
  },

  // Differences section
  differencesSection: {
    marginBottom: 15
  },
  differencesList: {
    marginLeft: 10
  },
  difference: {
    flexDirection: 'row',
    marginBottom: 5,
    alignItems: 'flex-start'
  },
  differenceBullet: {
    fontSize: 8,
    color: '#dc2626',
    marginRight: 8,
    marginTop: 2
  },
  differenceText: {
    fontSize: 9,
    color: '#1e293b',
    flex: 1,
    lineHeight: 1.4
  },

  // Footer styles
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 60,
    right: 60,
    borderTop: '1px solid #e2e8f0',
    paddingTop: 8,
    fontSize: 8,
    color: '#64748b',
    textAlign: 'center',
    backgroundColor: 'white'
  },
  footerText: {
    marginBottom: 2
  },

  // Page break
  pageBreak: {
    break: true
  }
})