import { Metadata } from 'next';
import PricingTable from '@/components/billing/pricing-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Zap, Star, Crown, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Prezzi - BrokerAI',
  description: 'Scegli il piano perfetto per le tue esigenze di confronto polizze assicurative',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Prezzi Semplici e Trasparenti
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Scegli il piano perfetto per le tue esigenze di confronto polizze assicurative. 
            Inizia gratis e scala quando ne hai bisogno.
          </p>
        </div>

        {/* Pricing Table */}
        <PricingTable />

        {/* FAQ Section */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-center mb-12">
            Domande Frequenti
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Posso cambiare piano in qualsiasi momento?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Sì, puoi fare upgrade o downgrade del tuo piano in qualsiasi momento. 
                  Le modifiche saranno applicate immediatamente e fatturate proporzionalmente.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cosa succede se supero i limiti?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Ti invieremo una notifica quando ti avvicini ai limiti del tuo piano. 
                  Puoi sempre fare upgrade per continuare a utilizzare il servizio senza interruzioni.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">È disponibile un trial gratuito?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Sì! Tutti i piani a pagamento includono un trial gratuito di 7 giorni. 
                  Puoi cancellare in qualsiasi momento durante il periodo di prova.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Offrite sconti per pagamenti annuali?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Sì! Scegliendo il pagamento annuale risparmi l'equivalente di 2 mesi 
                  rispetto al pagamento mensile.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features Comparison */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-center mb-12">
            Confronto Dettagliato delle Features
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border rounded-lg">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border border-border p-4 text-left">Feature</th>
                  <th className="border border-border p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Zap className="h-4 w-4 text-blue-500" />
                      Free
                    </div>
                  </th>
                  <th className="border border-border p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      Professional
                    </div>
                  </th>
                  <th className="border border-border p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Crown className="h-4 w-4 text-purple-500" />
                      Enterprise
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-border p-4 font-medium">Analisi polizze mensili</td>
                  <td className="border border-border p-4 text-center">5</td>
                  <td className="border border-border p-4 text-center">100</td>
                  <td className="border border-border p-4 text-center">Illimitate</td>
                </tr>
                <tr className="bg-muted/20">
                  <td className="border border-border p-4 font-medium">Compagnie attive</td>
                  <td className="border border-border p-4 text-center">2</td>
                  <td className="border border-border p-4 text-center">10</td>
                  <td className="border border-border p-4 text-center">Illimitate</td>
                </tr>
                <tr>
                  <td className="border border-border p-4 font-medium">AI Analysis avanzata</td>
                  <td className="border border-border p-4 text-center">❌</td>
                  <td className="border border-border p-4 text-center">✅</td>
                  <td className="border border-border p-4 text-center">✅ Premium</td>
                </tr>
                <tr className="bg-muted/20">
                  <td className="border border-border p-4 font-medium">Export dati (PDF, Excel)</td>
                  <td className="border border-border p-4 text-center">❌</td>
                  <td className="border border-border p-4 text-center">✅</td>
                  <td className="border border-border p-4 text-center">✅</td>
                </tr>
                <tr>
                  <td className="border border-border p-4 font-medium">API Access</td>
                  <td className="border border-border p-4 text-center">❌</td>
                  <td className="border border-border p-4 text-center">❌</td>
                  <td className="border border-border p-4 text-center">✅</td>
                </tr>
                <tr className="bg-muted/20">
                  <td className="border border-border p-4 font-medium">Support</td>
                  <td className="border border-border p-4 text-center">Email</td>
                  <td className="border border-border p-4 text-center">Prioritario</td>
                  <td className="border border-border p-4 text-center">Dedicato 24/7</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 text-center">
          <Card className="max-w-2xl mx-auto border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-2xl">
                Pronto per Iniziare?
              </CardTitle>
              <CardDescription className="text-lg">
                Unisciti a centinaia di broker che già utilizzano BrokerAI per 
                ottimizzare il loro lavoro di confronto polizze.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="/auth/register" 
                  className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 text-sm font-medium transition-colors"
                >
                  Inizia Gratis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
                <a 
                  href="/dashboard" 
                  className="inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 text-sm font-medium transition-colors"
                >
                  Vedi Demo
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
