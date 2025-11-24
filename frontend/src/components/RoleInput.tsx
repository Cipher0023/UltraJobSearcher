"use client";

import { useState } from "react";

interface RoleInputProps {
  roles: string[];
  setRoles: (roles: string[]) => void;
}

export default function RoleInput({ roles, setRoles }: RoleInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleAddRole = () => {
    if (inputValue.trim() && !roles.includes(inputValue.trim())) {
      setRoles([...roles, inputValue.trim()]);
      setInputValue("");
    }
  };

  const handleRemoveRole = (roleToRemove: string) => {
    setRoles(roles.filter(role => role !== roleToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddRole();
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800">
      <h2 className="text-xl font-semibold text-foreground mb-4">Cargos Desejados</h2>
      
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ex: Full Stack Developer"
          className="flex-1 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
        />
        <button
          onClick={handleAddRole}
          className="px-6 py-2 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors font-medium"
        >
          Adicionar
        </button>
      </div>

      {roles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {roles.map((role) => (
            <div
              key={role}
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full text-sm text-foreground"
            >
              <span>{role}</span>
              <button
                onClick={() => handleRemoveRole(role)}
                className="text-foreground/50 hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
