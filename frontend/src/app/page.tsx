"use client";

import { useState } from "react";
import SourceManager from "@/components/SourceManager";
import RoleInput from "@/components/RoleInput";
import RunPanel from "@/components/RunPanel";
import ResultsTable from "@/components/ResultsTable";
import ProgressLog from "@/components/ProgressLog";
import CollectionsList from "@/components/CollectionsList";
import JobsViewer from "@/components/JobsViewer";

export default function Home() {
  const [roles, setRoles] = useState<string[]>([]);
  const [sources, setSources] = useState<Array<{ key: string; host: string; enabled: boolean }>>([]);
  const [results, setResults] = useState<any>(null);
  const [isCollecting, setIsCollecting] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCollect = async () => {
    setIsCollecting(true);
    setResults(null);

    try {
      const enabledSources = sources.filter(s => s.enabled).map(({ key, host }) => ({ key, host }));
      
      const response = await fetch("http://localhost:4000/api/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roles,
          sources: enabledSources,
          options: { concurrency: 3, pagesPerSource: 100 }
        })
      });

      const data = await response.json();
      setResults(data);
      
      // Atualizar lista de coleções e selecionar a nova
      if (data.ok && data.collectionId) {
        setRefreshTrigger(prev => prev + 1);
        setSelectedCollectionId(data.collectionId);
      }
    } catch (error) {
      console.error("Erro ao coletar vagas:", error);
      setResults({ ok: false, error: "Erro ao conectar com o backend" });
    } finally {
      setIsCollecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">UltraJob</h1>
          <p className="text-foreground/70">Colete descrições de vagas para otimizar seu currículo</p>
        </header>

        <div className="grid gap-6">
          <RoleInput roles={roles} setRoles={setRoles} />
          <SourceManager sources={sources} setSources={setSources} />
          <RunPanel 
            onCollect={handleCollect} 
            isCollecting={isCollecting}
            canCollect={roles.length > 0 && sources.some(s => s.enabled)}
          />
          <ProgressLog isCollecting={isCollecting} />
          {results && <ResultsTable results={results} />}
          
          <CollectionsList 
            onSelectCollection={setSelectedCollectionId}
            refreshTrigger={refreshTrigger}
          />
          
          <JobsViewer collectionId={selectedCollectionId} />
        </div>
      </div>
    </div>
  );
}
