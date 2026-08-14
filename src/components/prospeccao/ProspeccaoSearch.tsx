"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Loader2, MapPin, Phone, Globe, Star, CheckCircle2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { searchAndImportLeads, type ProspectResult } from "@/app/actions/prospeccao";

export function ProspeccaoSearch() {
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ProspectResult[] | null>(null);
  const [imported, setImported] = useState(0);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const res = await searchAndImportLeads(category, city);
      setResults(res.results);
      setImported(res.imported);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao buscar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Categoria (ex: restaurantes, salão de beleza, pet shop)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
            <Input
              placeholder="Cidade (ex: Porto Alegre, RS)"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
            <Button type="submit" className="bg-orange-600 hover:bg-orange-700 gap-1.5 shrink-0" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Buscar
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-100 rounded-lg px-4 py-3">{error}</p>
      )}

      {results && (
        <>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {results.length} empresa(s) encontrada(s) · <strong className="text-orange-600 dark:text-orange-400">{imported} nova(s) adicionada(s) como Lead</strong> no{" "}
            <Link href="/funil" className="underline hover:text-orange-600">
              Funil de Vendas
            </Link>
            {results.length - imported > 0 && ` · ${results.length - imported} já eram leads`}
          </p>

          {results.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-10 text-center">Nenhuma empresa encontrada para essa busca.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((r) => (
                <Card key={r.id} className="border-0 shadow-sm">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{r.name}</p>
                      {r.alreadyLead ? (
                        <span title="Já era um lead" className="shrink-0">
                          <CheckCircle2 className="h-4 w-4 text-gray-300 dark:text-gray-600" />
                        </span>
                      ) : (
                        <span title="Adicionado como novo lead" className="shrink-0">
                          <CheckCircle2 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        </span>
                      )}
                    </div>
                    {!r.website && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 dark:bg-amber-500/10 rounded-full px-2 py-0.5">
                        <AlertCircle className="h-3 w-3" />
                        Sem site — alta prioridade
                      </span>
                    )}
                    {r.address && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" /> {r.address}
                      </p>
                    )}
                    {r.phone && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 shrink-0" /> {r.phone}
                      </p>
                    )}
                    {r.website && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 truncate">
                        <Globe className="h-3.5 w-3.5 shrink-0" /> {r.website}
                      </p>
                    )}
                    {r.rating != null && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        <Star className="h-3.5 w-3.5 shrink-0" /> {r.rating.toLocaleString("pt-BR")} ({r.ratingCount || 0} avaliações)
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
