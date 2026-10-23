"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Plus, Trash2, Loader2, FileText, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { saveLeadAnalysis, generateLeadAnalysisDraft } from "@/app/actions/lead-analysis";

interface Section {
  key: string;
  title: string;
  content: string;
}

const SUGGESTIONS = ["Redes Sociais", "Site", "Google", "iFood", "Keeta", "99Food", "App Próprio"];

export function AnalysisEditor({
  leadId,
  initialSections,
}: {
  leadId: string;
  initialSections: { title: string; content: string }[];
}) {
  const [sections, setSections] = useState<Section[]>(
    initialSections.length
      ? initialSections.map((s, i) => ({ key: `existing-${i}`, ...s }))
      : [{ key: "new-0", title: "", content: "" }]
  );
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [isGenerating, startGenerate] = useTransition();
  const [generateError, setGenerateError] = useState<string | null>(null);

  function addSection(title = "") {
    setSaved(false);
    setSections((prev) => [...prev, { key: `new-${Date.now()}-${prev.length}`, title, content: "" }]);
  }

  function removeSection(key: string) {
    setSaved(false);
    setSections((prev) => prev.filter((s) => s.key !== key));
  }

  function updateSection(key: string, field: "title" | "content", value: string) {
    setSaved(false);
    setSections((prev) => prev.map((s) => (s.key === key ? { ...s, [field]: value } : s)));
  }

  function handleSave() {
    startTransition(async () => {
      await saveLeadAnalysis(
        leadId,
        sections.map(({ title, content }) => ({ title, content }))
      );
      setSaved(true);
    });
  }

  function handleGenerate() {
    if (hasContent && !confirm("Isso substitui as seções atuais pelo rascunho da IA. Continuar?")) return;
    setGenerateError(null);
    setSaved(false);
    startGenerate(async () => {
      const result = await generateLeadAnalysisDraft(leadId);
      if (!result.ok) {
        setGenerateError(result.error);
        return;
      }
      setSections(result.sections.map((s, i) => ({ key: `ai-${Date.now()}-${i}`, ...s })));
    });
  }

  const hasContent = sections.some((s) => s.title.trim() || s.content.trim());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 text-orange-600 border-orange-200 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-900"
          disabled={isGenerating}
          onClick={handleGenerate}
        >
          {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {isGenerating ? "Gerando..." : "Gerar análise com IA"}
        </Button>
      </div>
      {generateError && <p className="text-xs text-red-500 dark:text-red-400">{generateError}</p>}

      <div className="flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => addSection(s)}
            className="text-xs px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-orange-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
          >
            + {s}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {sections.map((section) => (
          <Card key={section.key} className="border-0 shadow-sm">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  value={section.title}
                  onChange={(e) => updateSection(section.key, "title", e.target.value)}
                  placeholder="Título da seção (ex: Redes Sociais)"
                  className="font-medium"
                />
                <button
                  onClick={() => removeSection(section.key)}
                  className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors shrink-0"
                  title="Remover seção"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <textarea
                value={section.content}
                onChange={(e) => updateSection(section.key, "content", e.target.value)}
                placeholder="O que analisamos e o que podemos melhorar..."
                rows={4}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <button
        onClick={() => addSection()}
        className="flex items-center gap-1.5 text-sm text-orange-600 dark:text-orange-400 hover:underline"
      >
        <Plus className="h-4 w-4" /> Adicionar seção
      </button>

      <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
        <Button onClick={handleSave} disabled={isPending} className="gap-2 bg-orange-600 hover:bg-orange-700">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Salvar Análise
        </Button>
        {saved && hasContent && (
          <Link
            href={`/funil/${leadId}/relatorio`}
            className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 hover:underline"
          >
            <FileText className="h-4 w-4" /> Ver relatório / texto de WhatsApp
          </Link>
        )}
      </div>
    </div>
  );
}
