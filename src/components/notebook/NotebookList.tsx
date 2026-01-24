'use client';

import React, { useRef, useState } from "react";
import type { NotebookItem } from "../../domains/notes/models";
import { NotebookCard } from "./NotebookCard";

interface Props {
  initialItems: NotebookItem[];
}

export const NotebookList: React.FC<Props> = ({ initialItems }) => {
  const [items, setItems] = useState<NotebookItem[]>(initialItems);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<NotebookItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pronouncingId, setPronouncingId] = useState<string | null>(null);
  const audioCacheRef = useRef<Record<string, string>>({});
  const audioRequestRef = useRef<Record<string, Promise<string>>>({});

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

  const handleEdit = (id: string) => {
    const item = items.find((entry) => entry.id === id);
    if (!item) return;
    setEditingId(id);
    setDraft({ ...item });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setDraft(null);
  };

  const handleChangeDraft = (next: Partial<NotebookItem>) => {
    setDraft((prev) => (prev ? { ...prev, ...next } : prev));
  };

  const handleSaveEdit = async () => {
    if (!draft) return;
    setError(null);
    setIsSaving(true);
    try {
      const response = await fetch("/api/notes/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.item) {
        throw new Error(data?.error || "Failed to save changes.");
      }
      setItems((prev) => prev.map((item) => (item.id === data.item.id ? data.item : item)));
      setEditingId(null);
      setDraft(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePronounce = async (text: string, id: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setError(null);
    const key = trimmed.toLowerCase();
    setPronouncingId(id);
    try {
      const cached = audioCacheRef.current[key];
      if (cached) {
        const audio = new Audio(cached);
        await audio.play();
        return;
      }

      if (!audioRequestRef.current[key]) {
        audioRequestRef.current[key] = fetch("/api/notes/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: trimmed }),
        })
          .then((response) => response.json().catch(() => null).then((data) => ({ response, data })))
          .then(({ response, data }) => {
            if (!response.ok || !data?.audioUrl) {
              throw new Error(data?.error || "Failed to generate audio.");
            }
            return data.audioUrl as string;
          })
          .finally(() => {
            delete audioRequestRef.current[key];
          });
      }

      const audioUrl = await audioRequestRef.current[key];
      audioCacheRef.current[key] = audioUrl;
      const audio = new Audio(audioUrl);
      await audio.play();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to play audio.");
    } finally {
      setPronouncingId(null);
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
          <NotebookCard
            key={item.id}
            item={item}
            draft={editingId === item.id ? draft : null}
            isEditing={editingId === item.id}
            isPronouncing={pronouncingId === item.id}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCancelEdit={handleCancelEdit}
            onSaveEdit={handleSaveEdit}
            onChangeDraft={handleChangeDraft}
            onPronounce={handlePronounce}
          />
        ))
      )}
      {isSaving ? (
        <p className="text-xs text-custom-text-dark/60">Saving changes...</p>
      ) : null}
    </div>
  );
};
