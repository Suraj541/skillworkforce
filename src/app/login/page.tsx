"use client";

import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json", origin: window.location.origin }, body: JSON.stringify({ email, password }) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) setError(body.error?.message ?? "Unable to sign in.");
    else window.location.href = "/workflows";
    setBusy(false);
  }
  return <main className="min-h-screen flex items-center justify-center bg-[#0b1018] p-6">
    <form onSubmit={submit} className="w-full max-w-sm rounded-lg border border-slate-800 bg-[#0d141f] p-6">
      <h1 className="text-xl font-semibold">Sign in to SkillForge</h1>
      <p className="mt-2 text-sm text-slate-400">Use the local bootstrap account configured by the operator.</p>
      <label className="mt-6 block text-sm text-slate-300">Email<input required type="email" value={email} onChange={event => setEmail(event.target.value)} className="mt-2 w-full rounded border border-slate-700 bg-slate-900 p-2 outline-none" /></label>
      <label className="mt-4 block text-sm text-slate-300">Password<input required type="password" value={password} onChange={event => setPassword(event.target.value)} className="mt-2 w-full rounded border border-slate-700 bg-slate-900 p-2 outline-none" /></label>
      {error && <p role="alert" className="mt-4 text-sm text-red-400">{error}</p>}
      <button disabled={busy} className="mt-6 w-full rounded bg-emerald-500 px-4 py-2 font-semibold text-slate-950 disabled:opacity-50">{busy ? "Signing in…" : "Sign in"}</button>
    </form>
  </main>;
}
