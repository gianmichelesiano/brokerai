import type { Metadata } from 'next'
import './globals.css'
import { AutumnProvider } from 'autumn-js/react'
import { AutumnCustomerProvider } from '@/hooks/useAutumnCustomer'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  title: 'BrokerAI - Confronto Polizze Assicurative',
  description: 'Piattaforma AI per il confronto e l\'analisi di polizze assicurative',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="it">
      <body>
        <AutumnProvider>
          <AutumnCustomerProvider>
            {children}
            <Toaster />
          </AutumnCustomerProvider>
        </AutumnProvider>
      </body>
    </html>
  )
}
