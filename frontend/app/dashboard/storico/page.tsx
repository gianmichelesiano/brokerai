"use client";

import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api"
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Eye, Trash2, FileDown, Search } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase"; // Import for Supabase client
import JsonComparisonViewer from "./JsonComparisonViewer"; // Import the JSON comparison viewer component

interface ConfrontoSalvato {
  id: number;
  nome: string;
  descrizione?: string;
  tipologia_id: number;
  tipologia_nome?: string;
  compagnie_nomi: string[];
  garanzie_count: number;
  created_at: string;
  updated_at: string;
}

interface ConfrontoSalvatoDetail extends ConfrontoSalvato {
  dati_confronto: any;
  compagnie_ids: number[];
  garanzie_ids: number[];
}

interface Tipologia {
  id: number;
  nome: string;
}

export default function StoricoPage() {
  const [confronti, setConfronti] = useState<ConfrontoSalvato[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConfronto, setSelectedConfronto] = useState<ConfrontoSalvatoDetail | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [tipologie, setTipologie] = useState<Tipologia[]>([]);
  const [filterTipologia, setFilterTipologia] = useState<number | "">("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchTipologie();
  }, []);

  useEffect(() => {
    fetchConfronti();
    // eslint-disable-next-line
  }, [filterTipologia, search]);

  const fetchTipologie = async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        toast.error("Utente non autenticato. Effettua il login.");
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/tipologia-assicurazione/?page=1&size=100`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (!res.ok) throw new Error("Errore nel caricamento tipologie");
      const data = await res.json();
      setTipologie(data.items || []);
    } catch (e) {
      toast.error("Errore nel caricamento tipologie");
    }
  };

  const fetchConfronti = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        toast.error("Utente non autenticato. Effettua il login.");
        setLoading(false);
        return;
      }

      let url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/confronti/storico?page=1&size=100`;
      if (filterTipologia) url += `&tipologia_id=${filterTipologia}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (!res.ok) throw new Error("Errore nel caricamento confronti");
      const data = await res.json();
      setConfronti(data);
    } catch (e) {
      toast.error("Errore nel caricamento confronti");
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (id: number) => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        toast.error("Utente non autenticato. Effettua il login.");
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/confronti/storico/${id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (!res.ok) throw new Error("Errore nel recupero dettagli");
      const data = await res.json();
      setSelectedConfronto(data);
      setShowDetail(true);
    } catch (e) {
      toast.error("Errore nel recupero dettagli confronto");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Sei sicuro di voler eliminare questo confronto?")) return;
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        toast.error("Utente non autenticato. Effettua il login.");
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/confronti/storico/${id}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (!res.ok) throw new Error("Errore nell'eliminazione");
      toast.success("Confronto eliminato");
      setConfronti(confronti.filter(c => c.id !== id));
      if (selectedConfronto?.id === id) setShowDetail(false);
    } catch (e) {
      toast.error("Errore nell'eliminazione confronto");
    }
  };

  const handleExportPDF = (id: number) => {
    toast.info("Funzionalità di esportazione PDF non ancora implementata.");
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Storico Confronti Polizze</h1>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Cerca per nome..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Button variant="outline" onClick={fetchConfronti}>
            <Search className="h-4 w-4 mr-2" />
            Cerca
          </Button>
        </div>
        <div>
          <select
            className="border rounded px-3 py-2"
            value={filterTipologia}
            onChange={e => setFilterTipologia(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">Tutte le tipologie</option>
            {tipologie.map(t => (
              <option key={t.id} value={t.id}>{t.nome}</option>
            ))}
          </select>
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
        </div>
      ) : confronti.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">Nessun confronto salvato trovato.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {confronti.map(confronto => (
            <Card key={confronto.id} className="relative">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {confronto.nome}
                  <Badge variant="secondary">{confronto.tipologia_nome || "Tipologia"}</Badge>
                </CardTitle>
                <CardDescription>
                  {confronto.descrizione || <span className="text-xs text-muted-foreground">Nessuna descrizione</span>}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-2">
                  <span className="text-xs text-muted-foreground">Compagnie:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {confronto.compagnie_nomi.map((nome, i) => (
                      <Badge key={i} variant="outline">{nome}</Badge>
                    ))}
                  </div>
                </div>
                <div className="mb-2">
                  <span className="text-xs text-muted-foreground">Garanzie confrontate: </span>
                  <Badge variant="outline">{confronto.garanzie_count}</Badge>
                </div>
                <div className="mb-2">
                  <span className="text-xs text-muted-foreground">Creato il: </span>
                  {new Date(confronto.created_at).toLocaleString("it-IT")}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" onClick={() => handleView(confronto.id)}>
                    <Eye className="h-4 w-4 mr-1" /> Visualizza
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(confronto.id)}>
                    <Trash2 className="h-4 w-4 mr-1" /> Elimina
                  </Button>
                  {/* 
                  <Button size="sm" variant="secondary" onClick={() => handleExportPDF(confronto.id)}>
                    <FileDown className="h-4 w-4 mr-1" /> Esporta PDF
                  </Button>
                   */}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog Dettaglio */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dettagli Confronto</DialogTitle>
          </DialogHeader>
          {selectedConfronto ? (
            <div className="space-y-4">
              <div>
                <strong>Nome:</strong> {selectedConfronto.nome}
              </div>
              <div>
                <strong>Descrizione:</strong> {selectedConfronto.descrizione || <span className="text-xs text-muted-foreground">Nessuna descrizione</span>}
              </div>
              <div>
                <strong>Tipologia:</strong> {selectedConfronto.tipologia_nome}
              </div>
              <div>
                <strong>Compagnie:</strong>{" "}
                {selectedConfronto.compagnie_nomi.map((nome, i) => (
                  <Badge key={i} variant="outline">{nome}</Badge>
                ))}
              </div>
              <div>
                <strong>Garanzie confrontate:</strong> {selectedConfronto.garanzie_count}
              </div>
              <div>
                <strong>Creato il:</strong> {new Date(selectedConfronto.created_at).toLocaleString("it-IT")}
              </div>
              <div>
                <strong>Risulato:</strong>
                <JsonComparisonViewer data={selectedConfronto.dati_confronto} />
              </div>
            </div>
          ) : (
            <div>Caricamento dettagli...</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
