"use client";

import { useEffect, useState } from "react";

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  source: string;
  created_at: string;
}

interface JobsViewerProps {
  collectionId: number | null;
}

export default function JobsViewer({ collectionId }: JobsViewerProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<Array<{ source: string; count: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (collectionId) {
      loadJobs();
      loadStats();
    }
  }, [collectionId]);

  const loadJobs = async () => {
    if (!collectionId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:4000/api/collections/${collectionId}/jobs`);
      const data = await response.json();
      if (data.ok) {
        setJobs(data.jobs);
      }
    } catch (error) {
      console.error("Erro ao carregar vagas:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!collectionId) return;
    
    try {
      const response = await fetch(`http://localhost:4000/api/collections/${collectionId}/stats`);
      const data = await response.json();
      if (data.ok) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    }
  };

  const filteredJobs = jobs.filter(job => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      job.title?.toLowerCase().includes(term) ||
      job.company?.toLowerCase().includes(term) ||
      job.description?.toLowerCase().includes(term)
    );
  });

  if (!collectionId) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800">
        <div className="text-center py-12 text-foreground/50">
          Selecione uma coleção para ver as vagas
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800">
        <div className="text-center py-12 text-foreground/50">Carregando vagas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      {stats.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800">
          <h3 className="text-lg font-semibold text-foreground mb-4">Estatísticas</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div key={stat.source} className="text-center p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                <div className="text-2xl font-bold text-foreground">{stat.count}</div>
                <div className="text-sm text-foreground/60 capitalize">{stat.source}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de Vagas */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Vagas Encontradas ({filteredJobs.length})
          </h3>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar vagas..."
            className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
          />
        </div>

        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              onClick={() => setSelectedJob(job)}
              className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground mb-1">{job.title || "Sem título"}</h4>
                  <div className="text-sm text-foreground/70 mb-2">
                    {job.company && <span>{job.company}</span>}
                    {job.company && job.location && <span> • </span>}
                    {job.location && <span>{job.location}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs text-foreground capitalize">
                      {job.source}
                    </span>
                    {job.url && (
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-foreground/60 hover:text-foreground underline"
                      >
                        Ver vaga
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Detalhes */}
      {selectedJob && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedJob(null)}
        >
          <div
            className="bg-white dark:bg-zinc-900 rounded-lg p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {selectedJob.title || "Sem título"}
                </h3>
                <div className="text-foreground/70">
                  {selectedJob.company && <span>{selectedJob.company}</span>}
                  {selectedJob.company && selectedJob.location && <span> • </span>}
                  {selectedJob.location && <span>{selectedJob.location}</span>}
                </div>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-foreground/50 hover:text-foreground"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <span className="px-3 py-1 bg-zinc-200 dark:bg-zinc-700 rounded text-sm text-foreground capitalize">
                {selectedJob.source}
              </span>
            </div>

            <div className="prose dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-foreground/80">
                {selectedJob.description || "Sem descrição disponível"}
              </div>
            </div>

            {selectedJob.url && (
              <div className="mt-6">
                <a
                  href={selectedJob.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-3 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors font-medium"
                >
                  Ver Vaga Completa
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
