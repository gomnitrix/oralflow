"use client";

import React, { useState } from "react";
import Link from "next/link";
import EvaluationModal from "@/components/zen/EvaluationModal";

export default function ZenMode() {
  const [isListening, setIsListening] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showEvaluation, setShowEvaluation] = useState(false);

  const handleEndCall = () => {
    setIsListening(false);
    setShowEvaluation(true);
  };

  const handleCloseEvaluation = () => {
    setShowEvaluation(false);
    // Navigate back or reset
  };

  const handleSaveToNotebook = () => {
    // Logic to save
    console.log("Saved to notebook");
    setShowEvaluation(false);
  };

  return (
    <div className="flex-1 flex flex-col relative h-full">
      <header className="absolute top-0 left-0 right-0 p-6 z-10">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/scenarios"
            className="text-[#896b61] dark:text-gray-400 text-base font-medium leading-normal"
          >
            Scenarios
          </Link>
          <span className="text-[#896b61] dark:text-gray-500 text-base font-medium leading-normal">
            /
          </span>
          <span className="text-[#181311] dark:text-gray-100 text-base font-medium leading-normal">
            Ordering Coffee
          </span>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        {/* Dynamic AI Orb */}
        <div className="w-full max-w-lg aspect-square">
          <div className="w-full h-full bg-gradient-to-br from-orange-200 via-rose-200 to-purple-200 dark:from-orange-800 dark:via-rose-800 dark:to-purple-900 rounded-full blur-3xl opacity-60 animate-pulse"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-2xl font-semibold text-gray-500 dark:text-gray-400">
            {isListening ? "Listening..." : "Thinking..."}
          </p>
        </div>
      </div>

      <footer className="w-full p-6 z-10">
        <div className="flex justify-center">
          <div className="flex gap-4 p-3 bg-white/60 dark:bg-black/30 backdrop-blur-sm rounded-full border border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setIsListening(!isListening)}
              className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 w-12 bg-[#f4f1f0] dark:bg-gray-700 text-[#181311] dark:text-gray-100"
            >
              <span className="material-symbols-outlined">
                {isListening ? "mic" : "mic_off"}
              </span>
            </button>
            <button
              onClick={handleEndCall}
              className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 w-12 bg-red-600 text-white"
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
          className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-white/60 dark:bg-black/30 backdrop-blur-sm text-[#181311] dark:text-gray-100 gap-2 border border-gray-200 dark:border-gray-800"
        >
          <span className="material-symbols-outlined text-base">segment</span>
          <span className="truncate text-sm font-bold leading-normal tracking-[0.015em]">
            Transcript
          </span>
        </button>
      </div>

      {/* Transcript Panel (Optional, hidden by default) */}
      {showTranscript && (
        <div className="absolute top-20 right-6 bottom-24 w-80 bg-white/90 dark:bg-black/80 backdrop-blur-md rounded-xl p-4 shadow-lg overflow-y-auto z-20 border border-gray-200 dark:border-gray-800">
          <h3 className="font-bold mb-2">Transcript</h3>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-bold text-primary">AI:</span> Hello! What
              can I get for you today?
            </p>
            <p>
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
      />
    </div>
  );
}
