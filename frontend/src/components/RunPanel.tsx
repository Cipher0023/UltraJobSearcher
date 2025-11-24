"use client";

interface RunPanelProps {
  onCollect: () => void;
  isCollecting: boolean;
  canCollect: boolean;
}

export default function RunPanel({ onCollect, isCollecting, canCollect }: RunPanelProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-1">Iniciar Coleta</h2>
          <p className="text-sm text-foreground/60">
            {!canCollect 
              ? "Adicione pelo menos um cargo e ative uma fonte de dados"
              : "Pronto para coletar descrições de vagas"
            }
          </p>
        </div>
        <button
          onClick={onCollect}
          disabled={!canCollect || isCollecting}
          className="px-8 py-3 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCollecting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Coletando...
            </span>
          ) : (
            "Coletar Vagas"
          )}
        </button>
      </div>
    </div>
  );
}
