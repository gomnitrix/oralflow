'use client';

import React, { useState } from "react";
import type { NotebookItem } from "../../domains/notes/models";
import { NotebookCard } from "./NotebookCard";

interface Props {
  initialItems: NotebookItem[];
}

export const NotebookList: React.FC<Props> = ({ initialItems }) => {
  const [items, setItems] = useState<NotebookItem[]>(initialItems);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      const response = await fetch(`/api/notes/items?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to delete");
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      {error && <div className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg p-3">{error}</div>}
      {items.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 border border-custom-border shadow-sm text-center">
          <p className="text-lg font-bold text-custom-text-dark">No notebook items yet</p>
          <p className="text-custom-text-dark/60 mt-1">Save from StW, Zen, or Ask to see them here.</p>
          <div className="flex justify-center gap-4 mt-4">
            <a className="text-custom-primary font-bold hover:underline" href="/ask">
              Try Ask
            </a>
            <a className="text-custom-primary font-bold hover:underline" href="/scenarios/create">
              Scenario Studio
            </a>
          </div>
        </div>
      ) : (
        items.map((item) => (
          <NotebookCard key={item.id} item={item} onDelete={handleDelete} />
        ))
      )}
    </div>
  );
};
