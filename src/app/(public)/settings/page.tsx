'use client';

import React, { useEffect, useState } from 'react';
import type { AISettings, AIConfigUpdate } from '@/services/ai/settings';

const difficultyOptions = ["A2", "B1", "B1+", "B2", "C1"];
const granularityOptions = [
  { label: "Phoneme", value: "phoneme" },
  { label: "Word", value: "word" },
  { label: "FullText", value: "fulltext" },
];
const stwResponseOptions = [
  { label: "Sequential (Chat + TTS)", value: "sequential" },
  { label: "Native Audio (End-to-End)", value: "native_audio" },
];

const clampTurn = (value: number) => Math.min(10, Math.max(1, Math.round(value || 1)));
const clampProbability = (value: number) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));

export default function SettingsPage() {
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearingCards, setClearingCards] = useState(false);
  const [clearError, setClearError] = useState<string | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/settings');
      const data = await res.json();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSettings();
  }, []);

  const updateConfig = async (update: AIConfigUpdate) => {
    if (!settings) return;
    setSaving(true);

    const nextConfig: AISettings['config'] = {
      copilot: { ...settings.config.copilot, ...(update.copilot ?? {}) },
      stw: { ...settings.config.stw, ...(update.stw ?? {}) },
      pronunciation: { ...settings.config.pronunciation, ...(update.pronunciation ?? {}) },
      training: { ...settings.config.training, ...(update.training ?? {}) },
    };

    setSettings({ ...settings, config: nextConfig });

    try {
      await fetch('/api/ai/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'config', data: update }),
      });
    } catch (error) {
      console.error('Failed to save settings', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClearTrainingCards = async () => {
    if (!confirm("Delete all training cards? Notes will be kept.")) return;
    setClearingCards(true);
    setClearError(null);
    try {
      const res = await fetch("/api/training/cards/clear", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "Failed to clear training cards.");
      }
    } catch (error) {
      setClearError(error instanceof Error ? error.message : "Failed to clear training cards.");
    } finally {
      setClearingCards(false);
    }
  };

  if (loading || !settings) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-custom-text-dark/70">Configure Copilot prompts, goal checks, and pronunciation granularity.</p>
        </div>
        {saving && <span className="text-xs text-custom-text-dark/60">Saving...</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-custom-border rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <p className="text-sm font-bold text-custom-text-dark">Copilot Difficulty — Distill</p>
            <p className="text-xs text-custom-text-dark/60">Controls the minimum level of phrases extracted from selected text.</p>
          </div>
          <select
            className="w-full rounded-xl border border-custom-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-custom-primary/40"
            value={settings.config.copilot.distillLevel}
            onChange={(e) => updateConfig({ copilot: { distillLevel: e.target.value } })}
          >
            {difficultyOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div className="bg-white border border-custom-border rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <p className="text-sm font-bold text-custom-text-dark">Copilot Difficulty — Inspiration</p>
            <p className="text-xs text-custom-text-dark/60">Sets how advanced the suggested ideas should be.</p>
          </div>
          <select
            className="w-full rounded-xl border border-custom-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-custom-primary/40"
            value={settings.config.copilot.inspirationLevel}
            onChange={(e) => updateConfig({ copilot: { inspirationLevel: e.target.value } })}
          >
            {difficultyOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-custom-border rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <p className="text-sm font-bold text-custom-text-dark">STW Goal Evaluation Start Turn</p>
            <p className="text-xs text-custom-text-dark/60">After the Nth AI bubble, start checking goal completion (1-10).</p>
          </div>
          <input
            type="number"
            min={1}
            max={10}
            step={1}
            value={settings.config.stw.goalEvaluationStartTurn}
            onChange={(e) => {
              const next = clampTurn(Number(e.target.value));
              updateConfig({ stw: { goalEvaluationStartTurn: next } });
            }}
            className="w-full rounded-xl border border-custom-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-custom-primary/40"
          />
        </div>

        <div className="bg-white border border-custom-border rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <p className="text-sm font-bold text-custom-text-dark">STW Response Mode</p>
            <p className="text-xs text-custom-text-dark/60">Choose how AI replies are generated in Stop-the-World mode.</p>
          </div>
          <select
            className="w-full rounded-xl border border-custom-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-custom-primary/40"
            value={settings.config.stw.responseMode}
            onChange={(e) => updateConfig({ stw: { responseMode: e.target.value as AISettings['config']['stw']['responseMode'] } })}
          >
            {stwResponseOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="bg-white border border-custom-border rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <p className="text-sm font-bold text-custom-text-dark">Pronunciation Granularity</p>
            <p className="text-xs text-custom-text-dark/60">Choose the Azure assessment granularity used for feedback.</p>
          </div>
          <select
            className="w-full rounded-xl border border-custom-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-custom-primary/40"
            value={settings.config.pronunciation.granularity}
            onChange={(e) => updateConfig({ pronunciation: { granularity: e.target.value as AISettings['config']['pronunciation']['granularity'] } })}
          >
            {granularityOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-custom-border rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <p className="text-sm font-bold text-custom-text-dark">Read-Aloud Passing Threshold</p>
            <p className="text-xs text-custom-text-dark/60">Minimum Azure pronunciation score required to pass.</p>
          </div>
          <input
            type="number"
            min={0}
            max={100}
            step={1}
            value={settings.config.training.readAloudPassScore}
            onChange={(e) => updateConfig({ training: { readAloudPassScore: Number(e.target.value) } })}
            className="w-full rounded-xl border border-custom-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-custom-primary/40"
          />
        </div>

        <div className="bg-white border border-custom-border rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <p className="text-sm font-bold text-custom-text-dark">Training New Card Probability</p>
            <p className="text-xs text-custom-text-dark/60">Chance of generating new cards after each rating.</p>
          </div>
          <div className="space-y-3">
            {(["forgot", "hard", "good", "easy"] as const).map((rating) => (
              <label key={rating} className="flex items-center justify-between text-sm text-custom-text-dark">
                <span className="capitalize">{rating}</span>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={settings.config.training.newCardProbability[rating]}
                  onChange={(e) =>
                    updateConfig({
                      training: {
                        newCardProbability: {
                          ...settings.config.training.newCardProbability,
                          [rating]: clampProbability(Number(e.target.value)),
                        },
                      },
                    })
                  }
                  className="w-24 rounded-xl border border-custom-border px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-custom-primary/40"
                />
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-custom-border rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <p className="text-sm font-bold text-custom-text-dark">Clear All Training Cards</p>
          <p className="text-xs text-custom-text-dark/60">Deletes generated review cards but keeps notebook entries.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleClearTrainingCards}
            disabled={clearingCards}
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
          >
            {clearingCards ? "Clearing..." : "Clear Training Cards"}
          </button>
          {clearError && <span className="text-xs text-red-600">{clearError}</span>}
        </div>
      </div>
    </div>
  );
}
