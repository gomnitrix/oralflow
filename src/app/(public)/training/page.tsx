import React from "react";
import { TrainingFlow } from "../../../components/training/TrainingFlow";

export const dynamic = "force-dynamic";

export default function TrainingPage() {
  return (
    <main className="min-h-screen bg-custom-bg text-custom-text-dark p-6 lg:p-10">
      <header className="max-w-3xl mx-auto space-y-2">
        <h1 className="text-3xl font-black tracking-tight">Training</h1>
        <p className="text-custom-text-dark/70">Review, speak, and refine your saved expressions.</p>
      </header>

      <section className="max-w-3xl mx-auto mt-8 space-y-6">
        <TrainingFlow />
      </section>
    </main>
  );
}
