"use client";

import { useState } from "react";

interface Source {
  key: string;
  host: string;
  enabled: boolean;
}

interface SourceManagerProps {
  sources: Source[];
  setSources: (sources: Source[]) => void;
}

const DEFAULT_SOURCES = [
  { key: "linkedin", host: "linkedin.com", enabled: true },
  { key: "indeed", host: "indeed.com", enabled: true },
  { key: "gupy", host: "gupy.io", enabled: true },
  { key: "vagas", host: "vagas.com.br", enabled: false },
  { key: "greenhouse", host: "greenhouse.io", enabled: false },
  { key: "lever", host: "lever.co", enabled: false },
];

export default function SourceManager({ sources, setSources }: SourceManagerProps) {
  const [customUrl, setCustomUrl] = useState("");

  const handleLoadDefaults = () => {
    setSources(DEFAULT_SOURCES);
  };

  const handleToggleSource = (key: string) => {
    setSources(
      sources.map(s => s.key === key ? { ...s, enabled: !s.enabled } : s)
    );
  };

  const handleAddCustom = async () => {
    if (!customUrl.trim()) return;

    try {
      const response = await fetch("http://localhost:4000/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domains: [customUrl] })
      });

      const data = await response.json();
      
      if (data.sources && data.sources.length > 0) {
        const newSources = data.sources.map((s: any) => ({
          ...s,
          enabled: true
        }));
        
        setSources([...sources, ...newSources]);
        setCustomUrl("");
      }
    } catch (error) {
      console.error("Erro ao adicionar fonte:", error);
    }
  };

  const handleRemoveSource = (key: string) => {
    setSources(sources.filter(s => s.key !== key));
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-foreground">Fontes de Dados</h2>
        <button
          onClick={handleLoadDefaults}
          className="px-4 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 text-foreground rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
          Carregar Padrões
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={customUrl}
          onChange={(e) => setCustomUrl(e.target.value)}
          placeholder="Cole uma URL personalizada"
          className="flex-1 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
        />
        <button
          onClick={handleAddCustom}
          className="px-6 py-2 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors font-medium"
        >
          Adicionar
        </button>
      </div>

      {sources.length > 0 ? (
        <div className="space-y-2">
          {sources.map((source) => (
            <div
              key={source.key + source.host}
              className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={source.enabled}
                  onChange={() => handleToggleSource(source.key)}
                  className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600"
                />
                <div>
                  <div className="font-medium text-foreground capitalize">{source.key}</div>
                  <div className="text-sm text-foreground/60">{source.host}</div>
                </div>
              </div>
              <button
                onClick={() => handleRemoveSource(source.key)}
                className="text-foreground/50 hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-foreground/50">
          Nenhuma fonte adicionada. Clique em "Carregar Padrões" ou adicione uma URL personalizada.
        </div>
      )}
    </div>
  );
}
