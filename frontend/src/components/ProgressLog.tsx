"use client";

import { useEffect, useState } from "react";

interface LogEntry {
  timestamp: string;
  type: "start" | "complete" | "error";
  source: string;
  role: string;
  message: string;
  count?: number;
  error?: string;
}

interface ProgressLogProps {
  isCollecting: boolean;
}

export default function ProgressLog({ isCollecting }: ProgressLogProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    if (!isCollecting) {
      setLogs([]);
      return;
    }

    const eventSource = new EventSource("http://localhost:4000/api/progress");

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const logEntry: LogEntry = {
        ...data,
        timestamp: new Date().toLocaleTimeString(),
      };
      setLogs((prev) => [...prev, logEntry]);
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [isCollecting]);

  if (!isCollecting && logs.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800">
      <h2 className="text-xl font-semibold text-foreground mb-4">Progresso da Coleta</h2>
      
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {logs.map((log, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg text-sm ${
              log.type === "start"
                ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                : log.type === "complete"
                ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-foreground/60">{log.timestamp}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    log.type === "start"
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                      : log.type === "complete"
                      ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                      : "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                  }`}>
                    {log.source}
                  </span>
                </div>
                <div className="text-foreground">{log.message}</div>
                {log.count !== undefined && (
                  <div className="text-xs text-foreground/60 mt-1">
                    {log.count} vagas coletadas
                  </div>
                )}
              </div>
              {log.type === "start" && (
                <svg className="animate-spin h-5 w-5 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {log.type === "complete" && (
                <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {log.type === "error" && (
                <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
