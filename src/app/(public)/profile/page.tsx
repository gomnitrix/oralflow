"use client";

import React, { useEffect, useState } from "react";

type UserProfile = {
  username: string;
  avatarUrl: string;
};

const defaultProfile: UserProfile = {
  username: "Learner",
  avatarUrl: "",
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      try {
        const response = await fetch("/api/profile");
        const data = await response.json().catch(() => null);
        if (!response.ok || !data) return;
        if (isMounted) {
          setProfile({
            username: data.username ?? defaultProfile.username,
            avatarUrl: data.avatarUrl ?? "",
          });
        }
      } catch {
        // Ignore profile load errors.
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    void loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setProfile((prev) => ({ ...prev, avatarUrl: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data) {
        throw new Error(data?.error || "Failed to save profile.");
      }
      setProfile({
        username: data.username ?? profile.username,
        avatarUrl: data.avatarUrl ?? profile.avatarUrl,
      });
      setMessage("Profile saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveAvatar = () => {
    setProfile((prev) => ({ ...prev, avatarUrl: "" }));
  };

  if (isLoading) {
    return <div className="p-8">Loading profile...</div>;
  }

  return (
    <main className="min-h-screen bg-custom-bg p-8 lg:p-12">
      <div className="mx-auto max-w-3xl space-y-8">
        <header>
          <h1 className="text-custom-text-dark text-4xl font-black leading-tight tracking-tighter">Profile</h1>
          <p className="text-custom-text-dark/60 text-base">Manage your name and avatar.</p>
        </header>

        <section className="rounded-2xl border border-custom-border bg-white p-6 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div
                className="h-20 w-20 rounded-full bg-custom-bg bg-cover bg-center shadow-sm"
                style={{
                  backgroundImage: profile.avatarUrl
                    ? `url(${profile.avatarUrl})`
                    : 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAJ2Lt5Is3j3zzLp6vfyAeSDPkuwVyN1TikoD11G1X60UMj5nqkfIDUBp_oAXF-MZdhXNBSUWK2Ib4KjnZy6wrUcnWppKaHaNEkjTnQkrqTVLONf053bN4Eg4JPMJRXUIypbufc6qHnahkv46HZYaEuveOMj1Bntu2va3mzNsvpTxg65SL0LeANXFrtDwqGtxvzdRKOrxdTQ-KgF9mX7yx8fVd0fnUJTPeOrW8M1_wtK9IfivNuYpWkne2rNXRtVBXMwF7eRsa6-To")',
                }}
              />
              <div>
                <p className="text-sm font-semibold text-custom-text-dark">Avatar</p>
                <p className="text-xs text-custom-text-dark/60">Upload a square image for best results.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-custom-border px-4 py-2 text-sm font-semibold text-custom-text-dark hover:bg-custom-bg">
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                Upload
              </label>
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="inline-flex items-center gap-2 rounded-full border border-custom-border px-4 py-2 text-sm font-semibold text-custom-text-dark hover:bg-custom-bg"
              >
                Remove
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-custom-text-dark" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              value={profile.username}
              onChange={(event) => setProfile((prev) => ({ ...prev, username: event.target.value }))}
              className="w-full rounded-xl border border-custom-border bg-white px-4 py-3 text-custom-text-dark placeholder:text-custom-text-dark/30 focus:border-custom-primary focus:outline-none focus:ring-1 focus:ring-custom-primary transition-all"
              placeholder="Your name"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-full bg-custom-primary px-6 py-2 text-sm font-bold text-white shadow-sm shadow-custom-primary/20 hover:bg-custom-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving..." : "Save profile"}
            </button>
            {message ? <p className="text-sm text-custom-text-dark/60">{message}</p> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
