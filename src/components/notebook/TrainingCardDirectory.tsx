'use client';

import React, { useState, useEffect, useCallback } from "react";
import type { ReviewCard } from "../../domains/training/models";
import { Button } from "../shared/Button";

interface Props {
    notebookItemId: string;
}

export const TrainingCardDirectory: React.FC<Props> = ({ notebookItemId }) => {
    const [cards, setCards] = useState<ReviewCard[]>([]);
    const [loading, setLoading] = useState(false);
    const [regenerating, setRegenerating] = useState(false);
    const [regenCount, setRegenCount] = useState(3);
    const [error, setError] = useState<string | null>(null);

    const fetchCards = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/training/cards?notebookItemId=${notebookItemId}`);
            const data = await res.json();
            if (data.cards) {
                setCards(data.cards);
            }
        } catch (err) {
            console.error("Failed to fetch cards", err);
        } finally {
            setLoading(false);
        }
    }, [notebookItemId]);

    useEffect(() => {
        fetchCards();
    }, [fetchCards]);

    const handleRegenerate = async () => {
        setRegenerating(true);
        setError(null);
        try {
            const res = await fetch("/api/training/cards/regenerate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notebookItemId, count: regenCount }),
            });
            if (!res.ok) throw new Error("Failed to regenerate");
            const data = await res.json();
            // Append new cards or refetch? Refetch is safer to ensure consistency.
            await fetchCards();
        } catch (err) {
            setError("Failed to regenerate cards");
        } finally {
            setRegenerating(false);
        }
    };

    const handleDelete = async (cardId: string) => {
        if (!confirm("Delete this card?")) return;
        try {
            const res = await fetch(`/api/training/cards?id=${cardId}`, { method: "DELETE" });
            if (res.ok) {
                setCards((prev) => prev.filter((c) => c.id !== cardId));
            }
        } catch (err) {
            console.error("Failed to delete card", err);
        }
    };

    if (loading && cards.length === 0) return <div className="p-4 text-sm text-gray-500">Loading cards...</div>;

    return (
        <div className="mt-4 border-t border-custom-border pt-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-custom-text-dark">Training Cards ({cards.length})</h3>
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        min={1}
                        max={5}
                        value={regenCount}
                        onChange={(e) => setRegenCount(Number(e.target.value))}
                        className="w-16 px-2 py-1 text-sm border border-custom-border rounded-lg"
                    />
                    <Button variant="secondary" onClick={handleRegenerate} disabled={regenerating}>
                        {regenerating ? "Generating..." : "Regenerate"}
                    </Button>
                </div>
            </div>

            {error && <div className="text-red-500 text-sm mb-2">{error}</div>}

            <div className="space-y-3">
                {cards.map((card) => (
                    <div key={card.id} className="bg-gray-50 p-3 rounded-lg border border-custom-border text-sm">
                        <div className="flex justify-between items-start mb-2">
                            <span className="font-mono text-xs text-custom-primary bg-custom-primary/10 px-2 py-0.5 rounded">
                                {card.type}
                            </span>
                            <button
                                onClick={() => handleDelete(card.id)}
                                className="text-gray-400 hover:text-red-500"
                                title="Delete card"
                            >
                                <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Front</p>
                                <div className="space-y-1">
                                    <p><span className="font-semibold">Title:</span> {card.content.front.title}</p>
                                    <p><span className="font-semibold">Prompt:</span> {card.content.front.prompt}</p>
                                    {card.content.front.cue && <p><span className="font-semibold">Cue:</span> {card.content.front.cue}</p>}
                                    {card.content.front.context && <p><span className="font-semibold">Context:</span> {card.content.front.context}</p>}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Back</p>
                                <p>{card.content.back.referenceAnswer}</p>
                                {card.content.back.notes && card.content.back.notes.length > 0 && (
                                    <ul className="list-disc list-inside mt-1 text-gray-600">
                                        {card.content.back.notes.map((note, i) => <li key={i}>{note}</li>)}
                                    </ul>
                                )}
                            </div>
                        </div>

                        {card.metadata && (
                            <div className="mt-2 text-xs text-gray-400">
                                Source: {card.metadata.source} | Tags: {card.metadata.tags?.join(", ")}
                            </div>
                        )}
                    </div>
                ))}
                {cards.length === 0 && !loading && (
                    <p className="text-gray-500 text-center py-4">No cards generated yet.</p>
                )}
            </div>
        </div>
    );
};
