"use client";

interface ResultsTableProps {
  results: {
    ok: boolean;
    file?: {
      json: string;
      csv: string;
      count: number;
    };
    error?: string;
  };
}

export default function ResultsTable({ results }: ResultsTableProps) {
  if (!results.ok) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 border border-red-200 dark:border-red-800">
        <h2 className="text-xl font-semibold text-red-900 dark:text-red-200 mb-2">Erro</h2>
        <p className="text-red-700 dark:text-red-300">{results.error || "Erro desconhecido"}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800">
      <h2 className="text-xl font-semibold text-foreground mb-4">Resultados</h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div>
            <div className="text-lg font-semibold text-green-900 dark:text-green-200">
              {results.file?.count || 0} vagas coletadas
            </div>
            <div className="text-sm text-green-700 dark:text-green-300">
              Coleta concluída com sucesso
            </div>
          </div>
          <svg className="w-12 h-12 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {results.file && (
          <div className="space-y-2">
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <div className="text-sm font-medium text-foreground mb-1">Arquivo JSON</div>
              <div className="text-xs text-foreground/60 font-mono break-all">{results.file.json}</div>
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <div className="text-sm font-medium text-foreground mb-1">Arquivo CSV</div>
              <div className="text-xs text-foreground/60 font-mono break-all">{results.file.csv}</div>
            </div>
          </div>
        )}

        <div className="text-sm text-foreground/60">
          Os arquivos foram salvos na pasta <code className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded">collected/</code> do backend.
        </div>
      </div>
    </div>
  );
}
