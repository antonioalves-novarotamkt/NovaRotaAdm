"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Loader2, MapPin, Phone, Globe, Star, CheckCircle2, AlertCircle, Instagram, Linkedin, Facebook, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { searchAndImportLeadsAisa, type AisaProspectResult } from "@/app/actions/prospeccao";
import { AISA_FONTE_LABELS, AISA_FONTES_PADRAO, type FiltroSite, type AisaFonte } from "@/lib/aisa-prospect";

const TODAS_FONTES = Object.keys(AISA_FONTE_LABELS) as AisaFonte[];

export function ProspeccaoSearch() {
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [bairro, setBairro] = useState("");
  const [filtroSite, setFiltroSite] = useState<FiltroSite>("todos");
  const [fontes, setFontes] = useState<AisaFonte[]>(AISA_FONTES_PADRAO);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<AisaProspectResult[] | null>(null);
  const [imported, setImported] = useState(0);

  function toggleFonte(fonte: AisaFonte) {
    setFontes((prev) => (prev.includes(fonte) ? prev.filter((f) => f !== fonte) : [...prev, fonte]));
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (fontes.length === 0) {
      setError("Selecione ao menos uma fonte de busca.");
      return;
    }
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const res = await searchAndImportLeadsAisa(category, city, bairro, filtroSite, fontes);
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
        <CardContent className="p-4 space-y-3">
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Categoria (ex: restaurantes, salão de beleza, pet shop)"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              />
              <Input
                placeholder="Cidade (ex: Porto Alegre)"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
              <Input
                placeholder="Bairro (opcional)"
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs text-gray-500 dark:text-gray-400">O que buscar:</span>
              <div className="flex flex-wrap gap-2">
                {TODAS_FONTES.map((fonte) => (
                  <label
                    key={fonte}
                    className={`flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1 cursor-pointer border ${
                      fontes.includes(fonte)
                        ? "border-orange-600 bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 font-medium"
                        : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={fontes.includes(fonte)}
                      onChange={() => toggleFonte(fonte)}
                      className="sr-only"
                    />
                    {AISA_FONTE_LABELS[fonte]}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>Filtrar por:</span>
              {(["todos", "sem-site", "com-site"] as FiltroSite[]).map((opcao) => (
                <button
                  key={opcao}
                  type="button"
                  onClick={() => setFiltroSite(opcao)}
                  className={`rounded-full px-2.5 py-1 ${
                    filtroSite === opcao
                      ? "bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 font-medium"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {opcao === "todos" ? "Todos" : opcao === "sem-site" ? "Sem site" : "Com site"}
                </button>
              ))}
            </div>
            <Button type="submit" className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 gap-1.5" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {loading ? "Pesquisando (pode levar até 1 min)..." : "Buscar"}
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
              {results.map((r, i) => (
                <Card key={`${r.instagramUrl || r.linkedinUrl || r.telefone || r.nome}-${i}`} className="border-0 shadow-sm">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{r.nome}</p>
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
                    {!r.temSiteProprio && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 dark:bg-amber-500/10 rounded-full px-2 py-0.5">
                        <AlertCircle className="h-3 w-3" />
                        {r.tipoSite || "Sem site próprio"}
                      </span>
                    )}
                    {r.categoria && <p className="text-xs text-gray-500 dark:text-gray-400">{r.categoria}</p>}
                    {r.endereco && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" /> {r.endereco}
                      </p>
                    )}
                    {r.whatsappLink ? (
                      <a
                        href={r.whatsappLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 hover:underline"
                      >
                        <Phone className="h-3.5 w-3.5 shrink-0" /> WhatsApp: {r.telefone}
                      </a>
                    ) : (
                      r.telefone && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 shrink-0" /> {r.telefone}
                        </p>
                      )
                    )}
                    {r.email && (
                      <a
                        href={`mailto:${r.email}`}
                        className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 hover:underline truncate"
                      >
                        <Mail className="h-3.5 w-3.5 shrink-0" /> {r.email}
                      </a>
                    )}
                    {r.instagramUrl && (
                      <a
                        href={r.instagramUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 hover:underline truncate"
                      >
                        <Instagram className="h-3.5 w-3.5 shrink-0" /> Instagram
                      </a>
                    )}
                    {r.facebookUrl && (
                      <a
                        href={r.facebookUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 hover:underline truncate"
                      >
                        <Facebook className="h-3.5 w-3.5 shrink-0" /> Facebook
                      </a>
                    )}
                    {r.linkedinUrl && (
                      <a
                        href={r.linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 hover:underline truncate"
                      >
                        <Linkedin className="h-3.5 w-3.5 shrink-0" /> LinkedIn
                      </a>
                    )}
                    {r.temSiteProprio && r.siteUrl && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 truncate">
                        <Globe className="h-3.5 w-3.5 shrink-0" /> {r.siteUrl}
                      </p>
                    )}
                    {r.nota != null && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        <Star className="h-3.5 w-3.5 shrink-0" /> {r.nota.toLocaleString("pt-BR")} ({r.numeroAvaliacoes || 0} avaliações)
                      </p>
                    )}
                    {r.googleMapsUrl && (
                      <a href={r.googleMapsUrl} target="_blank" rel="noreferrer" className="text-xs text-orange-600 dark:text-orange-400 hover:underline">
                        Abrir no Google Maps
                      </a>
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
