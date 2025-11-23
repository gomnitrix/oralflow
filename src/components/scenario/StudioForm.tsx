'use client';

import React, { useState } from "react";
import { Button } from "../shared/Button";

export interface StudioFormValues {
  title: string;
  description: string;
  mode: "manual" | "ai" | "import";
}

export interface StudioFormProps {
  initialTitle?: string;
  onSubmit?: (values: StudioFormValues) => void;
}

export const StudioForm: React.FC<StudioFormProps> = ({ initialTitle = "", onSubmit }) => {
  const [values, setValues] = useState<StudioFormValues>({
    title: initialTitle,
    description: "",
    mode: "manual",
  });
  const [error, setError] = useState<string | null>(null);

  const handleChange =
    (field: keyof StudioFormValues) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!values.title.trim()) {
      setError("Title is required");
      return;
    }
    setError(null);
    onSubmit?.(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-surface-card p-4 shadow-card">
      <div className="flex items-center gap-3">
        <label className="text-sm text-white/70 w-24">Mode</label>
        <select
          value={values.mode}
          onChange={(e) => setValues((prev) => ({ ...prev, mode: e.target.value as StudioFormValues["mode"] }))}
          className="flex-1 rounded-lg bg-surface-subtle p-2 text-white"
        >
          <option value="manual">Manual</option>
          <option value="ai">AI Generate</option>
          <option value="import">Import</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm text-white/70">Title</label>
        <input
          className="w-full rounded-lg bg-surface-subtle p-2 text-white"
          value={values.title}
          onChange={handleChange("title")}
          placeholder="Coffee chat with a mentor"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm text-white/70">Description</label>
        <textarea
          className="w-full rounded-lg bg-surface-subtle p-2 text-white"
          value={values.description}
          onChange={handleChange("description")}
          placeholder="Discuss goals, ask for feedback, and practice clarity."
        />
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <Button type="submit">Save Scenario</Button>
    </form>
  );
};
