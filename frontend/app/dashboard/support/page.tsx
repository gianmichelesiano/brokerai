'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  HelpCircle, 
  ExternalLink,
  Mail,
  FileText,
  Info,
  MessageCircle,
  Book,
  Phone
} from 'lucide-react'

export default function SupportPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Supporto</h1>
          <p className="text-muted-foreground">
            Trova aiuto e risorse per utilizzare al meglio BrokerAI
          </p>
        </div>
        <Badge variant="default" className="bg-green-500">
          <Info className="h-3 w-3 mr-1" />
          Sistema Operativo
        </Badge>
      </div>

      {/* Supporto e Documentazione */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Documentazione */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5 text-blue-500" />
              Documentazione
            </CardTitle>
            <CardDescription>
              Guide complete per utilizzare tutte le funzionalità
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Accedi alla documentazione completa con tutorial passo-passo, esempi pratici e best practices.
            </p>
            <Button variant="outline" className="w-full" asChild>
              <a href="#" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Apri Documentazione
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Supporto Email */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-green-500" />
              Supporto Email
            </CardTitle>
            <CardDescription>
              Contatta il nostro team per assistenza personalizzata
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Il nostro team di supporto risponde entro 24 ore nei giorni lavorativi.
            </p>
            <Button variant="outline" className="w-full" asChild>
              <a href="mailto:support@brokerai.com">
                <Mail className="h-4 w-4 mr-2" />
                Invia Email
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Chat Support */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-purple-500" />
              Chat dal Vivo
            </CardTitle>
            <CardDescription>
              Assistenza immediata tramite chat
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Disponibile dal lunedì al venerdì, 9:00-18:00 CET.
            </p>
            <Button variant="outline" className="w-full" disabled>
              <MessageCircle className="h-4 w-4 mr-2" />
              Prossimamente
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Domande Frequenti
          </CardTitle>
          <CardDescription>
            Risposte alle domande più comuni sull'utilizzo di BrokerAI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <details className="group border rounded-lg">
              <summary className="flex cursor-pointer items-center justify-between p-4 font-medium hover:bg-muted/50">
                Come posso cambiare il mio piano di abbonamento?
                <span className="transition group-open:rotate-180">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </summary>
              <div className="px-4 pb-4 text-sm text-muted-foreground">
                Puoi cambiare il tuo piano dalla sezione "Impostazioni" del dashboard. Vai su Impostazioni → Piano & Fatturazione e seleziona il piano che preferisci. Le modifiche saranno applicate immediatamente.
              </div>
            </details>

            <details className="group border rounded-lg">
              <summary className="flex cursor-pointer items-center justify-between p-4 font-medium hover:bg-muted/50">
                Come funzionano i limiti di utilizzo mensili?
                <span className="transition group-open:rotate-180">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </summary>
              <div className="px-4 pb-4 text-sm text-muted-foreground">
                I limiti di utilizzo si resettano automaticamente il primo giorno di ogni mese. Puoi monitorare il tuo utilizzo corrente nella sezione "Impostazioni". Riceverai notifiche quando ti avvicini ai limiti del tuo piano.
              </div>
            </details>

            <details className="group border rounded-lg">
              <summary className="flex cursor-pointer items-center justify-between p-4 font-medium hover:bg-muted/50">
                Posso esportare i miei dati e analisi?
                <span className="transition group-open:rotate-180">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </summary>
              <div className="px-4 pb-4 text-sm text-muted-foreground">
                L'export dei dati è disponibile per i piani Professional ed Enterprise. Puoi esportare le tue analisi, confronti e dati delle compagnie in formato CSV o PDF. Contatta il supporto per assistenza nell'export di grandi volumi di dati.
              </div>
            </details>

            <details className="group border rounded-lg">
              <summary className="flex cursor-pointer items-center justify-between p-4 font-medium hover:bg-muted/50">
                Come posso aggiungere nuove compagnie assicurative?
                <span className="transition group-open:rotate-180">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </summary>
              <div className="px-4 pb-4 text-sm text-muted-foreground">
                Vai nella sezione "Compagnie" e clicca su "Nuova Compagnia". Puoi inserire i dati manualmente o caricare documenti che verranno analizzati automaticamente dall'AI per estrarre le informazioni rilevanti.
              </div>
            </details>

            <details className="group border rounded-lg">
              <summary className="flex cursor-pointer items-center justify-between p-4 font-medium hover:bg-muted/50">
                Cosa fare se l'analisi AI non funziona correttamente?
                <span className="transition group-open:rotate-180">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </summary>
              <div className="px-4 pb-4 text-sm text-muted-foreground">
                Se l'analisi AI produce risultati inaspettati, verifica che il documento sia leggibile e in formato supportato (PDF, DOCX). Per documenti complessi, prova a suddividerli in sezioni più piccole. Se il problema persiste, contatta il supporto con il documento specifico.
              </div>
            </details>
          </div>
        </CardContent>
      </Card>

      {/* Risorse Aggiuntive */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Video Tutorial */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-500" />
              Video Tutorial
            </CardTitle>
            <CardDescription>
              Guide video per iniziare rapidamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Configurazione iniziale dell'account
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Come caricare e analizzare polizze
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Confronto tra diverse compagnie
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Gestione clienti e preventivi
              </li>
            </ul>
            <Button variant="outline" className="w-full" disabled>
              <ExternalLink className="h-4 w-4 mr-2" />
              Prossimamente
            </Button>
          </CardContent>
        </Card>

        {/* Informazioni Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-gray-500" />
              Informazioni Sistema
            </CardTitle>
            <CardDescription>
              Dettagli tecnici e stato del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Versione:</span>
                <span className="text-muted-foreground">v1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Ultimo Aggiornamento:</span>
                <span className="text-muted-foreground">Gennaio 2025</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Stato API:</span>
                <Badge variant="default" className="bg-green-500">Operativo</Badge>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Stato AI:</span>
                <Badge variant="default" className="bg-green-500">Operativo</Badge>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Regione:</span>
                <span className="text-muted-foreground">Europa (EU)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contatti Emergenza */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <Phone className="h-5 w-5" />
            Supporto Urgente
          </CardTitle>
          <CardDescription className="text-orange-700">
            Per problemi critici che bloccano la tua attività
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-orange-800 mb-4">
            Se stai riscontrando problemi critici che impediscono il normale svolgimento della tua attività, 
            contattaci immediatamente via email specificando "URGENTE" nell'oggetto.
          </p>
          <Button variant="outline" className="border-orange-300 text-orange-800 hover:bg-orange-100" asChild>
            <a href="mailto:support@brokerai.com?subject=URGENTE - Supporto Critico">
              <Mail className="h-4 w-4 mr-2" />
              Contatto Urgente
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
