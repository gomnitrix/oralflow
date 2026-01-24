"use client";

import Link from "next/link";

export default function Dashboard() {
  return (
    <div className="p-8 lg:p-12">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        {/* PageHeading */}
        <header className="flex flex-wrap justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-custom-text-dark text-4xl font-black leading-tight tracking-tighter">
              Welcome back, Alex!
            </p>
            <p className="text-custom-text-dark/60 text-base font-normal leading-normal">
              Ready to speak with confidence?
            </p>
          </div>
        </header>

        {/* Stats */}
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="flex items-center gap-6 rounded-lg bg-white p-6 border border-custom-border">
            <div className="relative flex items-center justify-center size-16">
              <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="stroke-custom-primary/20"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  strokeWidth="3"
                ></path>
                <path
                  className="stroke-custom-primary"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  strokeDasharray="75, 100"
                  strokeLinecap="round"
                  strokeWidth="3"
                ></path>
              </svg>
              <span className="material-symbols-outlined absolute text-3xl text-custom-primary">
                timer
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-custom-text-dark/80 text-base font-medium leading-normal">
                Practice Time
              </p>
              <p className="text-custom-text-dark tracking-light text-3xl font-bold leading-tight">
                15 mins
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 rounded-lg bg-white p-6 border border-custom-border">
            <div className="relative flex items-center justify-center size-16">
              <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="stroke-custom-accent/20"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  strokeWidth="3"
                ></path>
                <path
                  className="stroke-custom-accent"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  strokeDasharray="40, 100"
                  strokeLinecap="round"
                  strokeWidth="3"
                ></path>
              </svg>
              <span className="material-symbols-outlined absolute text-3xl text-custom-accent">
                style
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-custom-text-dark/80 text-base font-medium leading-normal">
                Review Cards Due
              </p>
              <p className="text-custom-text-dark tracking-light text-3xl font-bold leading-tight">
                24 cards
              </p>
            </div>
          </div>
        </section>

        {/* SectionHeader */}
        <h2 className="text-custom-text-dark text-[22px] font-bold leading-tight tracking-tight pt-4">
          Start your session
        </h2>

        {/* ImageGrid */}
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Link
            href="/scenarios/create"
            className="flex cursor-pointer flex-col gap-4 rounded-lg bg-white p-5 border border-custom-border hover:shadow-lg hover:-translate-y-1 transition-all"
          >
            <div
              className="w-full bg-center bg-no-repeat aspect-[16/10] bg-cover rounded"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuB9CDrwWWiQTtlUn-9TbaPKre0mMSTHJPBSL88fDAepm2njGEaJ4QLyMSmL1vSaE-3csH5i9-fung42p0W9LVXuY-8TfcN2IuluNqt6VO2eY3Q4GbvC3jxWC325rP_Dx1lpGldj2EqiIxAOsYDBs60Z1PDvDQI__W9omO3OWJ9phrjRtgv8YIp18B4m2B-mylCs8DlV7k8qvV59yodL8sWP0XA0cwmfVsndWx2_HXdv4B5RLD-mIGcrwfBqr1H493ql0ShTNDnI5LY")',
              }}
            ></div>
            <div>
              <p className="text-custom-text-dark text-lg font-bold leading-normal">
                Create New Scenario
              </p>
              <p className="text-custom-text-dark/60 text-sm font-normal leading-normal">
                Role-play in a new situation.
              </p>
            </div>
          </Link>
          <Link
            href="/training"
            className="flex cursor-pointer flex-col gap-4 rounded-lg bg-white p-5 border border-custom-border hover:shadow-lg hover:-translate-y-1 transition-all"
          >
            <div
              className="w-full bg-center bg-no-repeat aspect-[16/10] bg-cover rounded"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCvlMRTeQPCZna0dwsf5XSoRctu1tYawYgWhhBbyQ6_8nkREitf8mSpQpny_H1kwZG8T6UjvFrOFptgQGJYi_cecyFLTxgeDgC5rA31Qepj9bPD203Nr9KDPFBaPSiXgSD-GhygiFxtzinHT_sSm3vAbSepayP9b73j6ErNPj8zwRXE6peIqsEoaCQHWgV1AqEcIgxf8DO3YdhtMcJF0ASPhj3eTqh8VFfAqMfTsuqQJ_pt5SC8QsKVBonYc4vHyoAGez5aAcMue6E")',
              }}
            ></div>
            <div>
              <p className="text-custom-text-dark text-lg font-bold leading-normal">
                Start Today&apos;s Review
              </p>
              <p className="text-custom-text-dark/60 text-sm font-normal leading-normal">
                Practice your saved flashcards.
              </p>
            </div>
          </Link>
        </section>

        {/* Secondary Action Cards */}
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="flex flex-col justify-between gap-4 rounded-lg bg-white p-5 border border-custom-border">
            <div className="flex items-start justify-between">
              <p className="text-custom-text-dark text-lg font-bold">
                Quick Lookup
              </p>
              <span className="material-symbols-outlined text-custom-accent">
                help
              </span>
            </div>
            <p className="text-custom-text-dark/60 text-sm">
              Ask the AI a quick question about grammar, vocabulary, or culture.
            </p>
            <Link
              href="/ask"
              className="w-full rounded-full bg-custom-accent/20 py-2 px-4 text-sm font-bold text-custom-accent hover:bg-custom-accent/30 transition-colors text-center"
            >
              Ask Anything
            </Link>
          </div>
          <div className="flex flex-col justify-between gap-4 rounded-lg bg-white p-5 border border-custom-border">
            <div className="flex items-start justify-between">
              <p className="text-custom-text-dark text-lg font-bold">
                Focused Drills
              </p>
              <span className="material-symbols-outlined text-custom-primary">
                target
              </span>
            </div>
            <p className="text-custom-text-dark/60 text-sm">
              Hone specific skills like pronunciation or verb conjugation.
            </p>
            <Link
              href="/training"
              className="w-full rounded-full bg-custom-primary/20 py-2 px-4 text-sm font-bold text-custom-primary hover:bg-custom-primary/30 transition-colors text-center"
            >
              Practice Drills
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
