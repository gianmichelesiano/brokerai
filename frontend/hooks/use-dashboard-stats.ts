"use client";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

type GaranzieStats = {
  total_garanzie: number;
  sezioni_count: number;
  sezioni: any[];
  garanzie_con_coperture: number;
  garanzie_senza_coperture: number;
  ultima_creazione?: string;
  ultima_modifica?: string;
};

type CompagnieStats = {
  total_compagnie: number;
  compagnie_con_file: number;
  compagnie_senza_file: number;
  compagnie_con_testo: number;
  compagnie_senza_testo: number;
  file_types: Record<string, number>;
  total_file_size: number;
  average_text_length?: number;
  ultima_creazione?: string;
  ultima_modifica?: string;
  ultima_analisi?: string;
};


export function useDashboardStats() {
  const [stats, setStats] = useState<{
    garanzie: GaranzieStats | null;
    compagnie: CompagnieStats | null;
  }>({
    garanzie: null,
    compagnie: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchStats() {
      setLoading(true);
      setError(null);
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
        const [garanzie, compagnie] = await Promise.all([
          apiGet<GaranzieStats>(`${baseUrl}/api/garanzie/stats`),
          apiGet<CompagnieStats>(`${baseUrl}/api/compagnie/stats`),
        ]);
        if (!cancelled) {
          setStats({ garanzie, compagnie });
        }
      } catch (err: any) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchStats();
    return () => {
      cancelled = true;
    };
  }, []);

  return { stats, loading, error };
}
