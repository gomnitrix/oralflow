"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import EvaluationModal from "@/components/zen/EvaluationModal";

function ZenModeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scenarioId = searchParams.get("scenarioId");
  const context = searchParams.get("context")?.trim() || "";
  const title = searchParams.get("title")?.trim() || "Zen Mode";
  const learnerRole = searchParams.get("userRole")?.trim() || "You";
  const aiRole = searchParams.get("aiRole")?.trim() || "AI Partner";
  const isFreeChat = Boolean(context);

  const [isListening, setIsListening] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showEvaluation, setShowEvaluation] = useState(false);

  // Mock data - in a real app this would come from the backend
  const mockEvaluation = {
    accuracy: 87,
    mistakes: [
      { id: "1", type: "Incorrect verb tense", correction: '"I have went" should be "I have gone".' },
      { id: "2", type: "Article usage", correction: '"I would like a coffee" instead of "I would like coffee".' },
      { id: "3", type: "Pronunciation", correction: 'Emphasize the \'s\' sound in "Espresso".' },
    ]
  };

  const handleEndCall = () => {
    setIsListening(false);
    setShowEvaluation(true);
  };

  const handleCloseEvaluation = () => {
    setShowEvaluation(false);
    router.push("/scenarios");
  };

  const handleSaveToNotebook = () => {
    // Logic to save
    console.log("Saved to notebook");
    setShowEvaluation(false);
    router.push("/notebook");
  };

  return (
    <div className="flex-1 flex flex-col relative h-full bg-custom-bg">
      <header className="absolute top-0 left-0 right-0 p-6 z-10">
        {isFreeChat ? (
          <div className="space-y-1">
            <div className="flex flex-wrap gap-2 items-center text-sm font-medium text-custom-text-dark/60">
              <Link href="/free-chat" className="hover:text-custom-text-dark transition-colors">
                Free Chat
              </Link>
              <span className="text-custom-text-dark/40">/</span>
              <span className="text-custom-text-dark">{title}</span>
            </div>
            <p className="text-custom-text-dark/60 text-sm">
              {learnerRole} · {aiRole}
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Link
              href="/scenarios"
              className="text-custom-text-dark/60 hover:text-custom-text-dark transition-colors text-base font-medium leading-normal"
            >
              Scenarios
            </Link>
            <span className="text-custom-text-dark/40 text-base font-medium leading-normal">
              /
            </span>
            <span className="text-custom-text-dark text-base font-medium leading-normal">
              Ordering Coffee
            </span>
          </div>
        )}
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        {/* Dynamic AI Orb */}
        <div className="w-full max-w-lg aspect-square">
          <div className="w-full h-full bg-gradient-to-br from-orange-200 via-rose-200 to-purple-200 dark:from-orange-800 dark:via-rose-800 dark:to-purple-900 rounded-full blur-3xl opacity-60 animate-pulse"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-2xl font-semibold text-custom-text-dark/60">
            {isListening ? "Listening..." : "Thinking..."}
          </p>
        </div>
      </div>

      <footer className="w-full p-6 z-10">
        {isFreeChat && context ? (
          <div className="max-w-3xl mx-auto mb-4 bg-white/70 backdrop-blur-sm border border-custom-border rounded-2xl p-4 shadow-sm text-sm text-custom-text-dark/80 whitespace-pre-wrap">
            <p className="text-xs font-bold text-custom-primary uppercase tracking-[0.18em] mb-2">Context</p>
            {context}
          </div>
        ) : null}
        <div className="flex justify-center">
          <div className="flex gap-4 p-3 bg-white/60 backdrop-blur-sm rounded-full border border-custom-border shadow-sm">
            <button
              onClick={() => setIsListening(!isListening)}
              className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 w-12 bg-custom-bg text-custom-text-dark hover:bg-custom-bg/80 transition-colors"
            >
              <span className="material-symbols-outlined">
                {isListening ? "mic" : "mic_off"}
              </span>
            </button>
            <button
              onClick={handleEndCall}
              className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 w-12 bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              <span className="material-symbols-outlined">call_end</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Single Button for Transcript */}
      <div className="absolute top-6 right-6 z-10">
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-white/60 backdrop-blur-sm text-custom-text-dark gap-2 border border-custom-border hover:bg-white/80 transition-colors"
        >
          <span className="material-symbols-outlined text-base">segment</span>
          <span className="truncate text-sm font-bold leading-normal tracking-[0.015em]">
            Transcript
          </span>
        </button>
      </div>

      {/* Transcript Panel */}
      {showTranscript && (
        <div className="absolute top-20 right-6 bottom-24 w-80 bg-white/90 backdrop-blur-md rounded-xl p-4 shadow-lg overflow-y-auto z-20 border border-custom-border">
          <h3 className="font-bold mb-2 text-custom-text-dark">Transcript</h3>
          <div className="space-y-2 text-sm">
            <p className="text-custom-text-dark">
              <span className="font-bold text-custom-primary">AI:</span> Hello! What
              can I get for you today?
            </p>
            <p className="text-custom-text-dark">
              <span className="font-bold">You:</span> Hi, I&apos;d like a coffee
              please.
            </p>
          </div>
        </div>
      )}

      <EvaluationModal
        isOpen={showEvaluation}
        onClose={handleCloseEvaluation}
        onSave={handleSaveToNotebook}
        data={mockEvaluation}
      />
    </div>
  );
}

export default function ZenMode() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <ZenModeContent />
    </Suspense>
  );
}
