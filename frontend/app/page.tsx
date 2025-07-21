import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Shield, Search, BarChart3, FileText, Zap, Users, CheckCircle } from "lucide-react"
import Link from "next/link"
import PricingTable from "@/components/billing/pricing-table"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50">
      {/* Header */}
      <header className="border-b bg-slate-800 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-slate-300" />
            <span className="text-xl font-bold text-white">Broker AI</span>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" asChild className="text-white hover:text-white hover:bg-slate-700">
              <Link href="#features">Funzionalità</Link>
            </Button>
            <Button variant="ghost" asChild className="text-white hover:text-white hover:bg-slate-700">
              <Link href="#pricing">Prezzi</Link>
            </Button>
            <Button variant="ghost" asChild className="text-white hover:text-white hover:bg-slate-700">
              <Link href="#how-it-works">Come Funziona</Link>
            </Button>
            <Button asChild className="bg-white text-slate-800 hover:bg-slate-100 font-semibold">
              <Link href="/auth/login">Accedi</Link>
            </Button>
          </div>
          <div className="md:hidden">
            <Button asChild className="bg-white text-slate-800 hover:bg-slate-100 font-semibold">
              <Link href="/auth/login">Accedi</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge variant="outline" className="mb-4">
            🚀 Powered by AI
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Sistema Intelligente per il
            <span className="text-slate-700"> Confronto Garanzie</span> Assicurative
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed max-w-3xl mx-auto">
            Analizza automaticamente le polizze assicurative con l'intelligenza artificiale, confronta le coperture tra
            diverse compagnie e prendi decisioni informate in pochi click.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" asChild className="text-lg px-8 w-full sm:w-auto">
              <Link href="/dashboard">
                Inizia Subito <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent w-full sm:w-auto">
              Guarda Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-16 lg:py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Funzionalità Principali</h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Un sistema completo per gestire, analizzare e confrontare le garanzie assicurative con la potenza
              dell'intelligenza artificiale.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-slate-600" />
                </div>
                <CardTitle>Gestione Garanzie</CardTitle>
                <CardDescription>
                  Crea e organizza il tuo database di garanzie assicurative per sezione e tipologia.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Catalogazione per sezioni
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Ricerca avanzata
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Gestione completa CRUD
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Gestione Compagnie</CardTitle>
                <CardDescription>
                  Carica e gestisci le polizze delle compagnie assicurative con estrazione automatica del testo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Upload PDF e DOCX
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Estrazione testo automatica
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Archiviazione sicura
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Analisi AI</CardTitle>
                <CardDescription>
                  Analisi automatica delle polizze con OpenAI per identificare le coperture disponibili.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Riconoscimento semantico
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Estrazione clausole
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Confidence scoring
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>Matrice Coperture</CardTitle>
                <CardDescription>
                  Visualizza in un colpo d'occhio quali garanzie sono coperte da ogni compagnia.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Vista tabellare
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Filtri avanzati
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Export dati
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle>Confronti Intelligenti</CardTitle>
                <CardDescription>
                  Confronta le coperture tra compagnie con analisi dettagliata delle differenze.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Confronto multi-compagnia
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Analisi differenze
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Storico confronti
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-indigo-600" />
                </div>
                <CardTitle>Sicurezza & Affidabilità</CardTitle>
                <CardDescription>
                  Dati sicuri e sempre disponibili con backup automatici e crittografia.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Crittografia end-to-end
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Backup automatici
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Uptime 99.9%
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 sm:py-16 lg:py-20 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Scegli il Piano Perfetto per Te</h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Piani flessibili per ogni esigenza, dal broker individuale alle grandi organizzazioni.
              Inizia gratis e scala quando ne hai bisogno.
            </p>
          </div>
          
          <PricingTable />
          
          <div className="text-center mt-12">
            <p className="text-sm text-gray-500 mb-4">
              Tutti i piani includono supporto tecnico e aggiornamenti gratuiti
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Sicurezza enterprise</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Backup automatici</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Uptime 99.9%</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Cancellazione in qualsiasi momento</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-12 sm:py-16 lg:py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Come Funziona</h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Un processo semplice e automatizzato per analizzare e confrontare le polizze assicurative.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            <div className="text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-lg sm:text-xl">1</span>
              </div>
              <h3 className="font-semibold text-base sm:text-lg mb-2">Carica le Polizze</h3>
              <p className="text-gray-600 text-sm">
                Carica i file PDF o DOCX delle polizze assicurative delle diverse compagnie.
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-lg sm:text-xl">2</span>
              </div>
              <h3 className="font-semibold text-base sm:text-lg mb-2">Analisi AI</h3>
              <p className="text-gray-600 text-sm">
                L'AI analizza automaticamente i documenti ed estrae le informazioni sulle coperture.
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-lg sm:text-xl">3</span>
              </div>
              <h3 className="font-semibold text-base sm:text-lg mb-2">Matrice Coperture</h3>
              <p className="text-gray-600 text-sm">
                Visualizza la matrice completa delle coperture per ogni compagnia e polizza.
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-lg sm:text-xl">4</span>
              </div>
              <h3 className="font-semibold text-base sm:text-lg mb-2">Confronta</h3>
              <p className="text-gray-600 text-sm">
                Confronta le coperture tra compagnie e ottieni analisi dettagliate delle differenze.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 bg-slate-800">
        <div className="container mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Pronto a Rivoluzionare la Tua Analisi Assicurativa?</h2>
          <p className="text-lg sm:text-xl text-slate-200 mb-8 max-w-2xl mx-auto">
            Inizia subito ad utilizzare il sistema più avanzato per il confronto delle polizze assicurative.
          </p>
          <Button size="lg" variant="secondary" asChild className="text-lg px-8 w-full sm:w-auto">
            <Link href="/dashboard">
              Accedi alla Dashboard <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8 sm:py-12 px-4">
        <div className="container mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-6 w-6 text-slate-400" />
                <span className="text-lg font-bold">Broker AI</span>
              </div>
              <p className="text-gray-400 text-sm">
                Sistema intelligente per il confronto delle polizze assicurative powered by AI.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Prodotto</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Funzionalità
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Prezzi
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Demo
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Supporto</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Documentazione
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Contatti
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Azienda</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Chi Siamo
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Termini
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-sm text-gray-400">
            © 2024 Broker AI. Tutti i diritti riservati.
          </div>
        </div>
      </footer>
    </div>
  )
}
