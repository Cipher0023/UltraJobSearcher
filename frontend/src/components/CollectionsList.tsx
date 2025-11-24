"use client";

import { useEffect, useState } from "react";

interface Collection {
  id: number;
  created_at: string;
  roles: string;
  sources: string;
  total_jobs: number;
}

interface CollectionsListProps {
  onSelectCollection: (id: number) => void;
  refreshTrigger?: number;
}

export default function CollectionsList({ onSelectCollection, refreshTrigger }: CollectionsListProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCollections = async () => {
    try {
      const response = await fetch("http://localhost:4000/api/collections");
      const data = await response.json();
      if (data.ok) {
        setCollections(data.collections);
      }
    } catch (error) {
      console.error("Erro ao carregar coleções:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCollections();
  }, [refreshTrigger]);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Tem certeza que deseja deletar esta coleção?")) return;

    try {
      await fetch(`http://localhost:4000/api/collections/${id}`, {
        method: "DELETE",
      });
      loadCollections();
    } catch (error) {
      console.error("Erro ao deletar coleção:", error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800">
        <h2 className="text-xl font-semibold text-foreground mb-4">Coleções Anteriores</h2>
        <div className="text-center py-8 text-foreground/50">Carregando...</div>
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800">
        <h2 className="text-xl font-semibold text-foreground mb-4">Coleções Anteriores</h2>
        <div className="text-center py-8 text-foreground/50">
          Nenhuma coleção encontrada. Faça sua primeira busca!
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800">
      <h2 className="text-xl font-semibold text-foreground mb-4">Coleções Anteriores</h2>
      
      <div className="space-y-2">
        {collections.map((collection) => {
          const roles = JSON.parse(collection.roles);
          const sources = JSON.parse(collection.sources);
          const date = new Date(collection.created_at).toLocaleString("pt-BR");

          return (
            <div
              key={collection.id}
              onClick={() => onSelectCollection(collection.id)}
              className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="font-medium text-foreground mb-1">
                    {roles.join(", ")}
                  </div>
                  <div className="text-sm text-foreground/60 mb-2">
                    {date}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sources.map((source: string) => (
                      <span
                        key={source}
                        className="px-2 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs text-foreground"
                      >
                        {source}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-foreground">
                      {collection.total_jobs}
                    </div>
                    <div className="text-xs text-foreground/60">vagas</div>
                  </div>
                  <button
                    onClick={(e) => handleDelete(collection.id, e)}
                    className="text-foreground/50 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
