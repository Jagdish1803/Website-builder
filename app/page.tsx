"use client";

import { useEffect, useState } from "react";

type Result = { url: string; html: string; sections: number };

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => setOrigin(window.location.origin), []);

  async function build(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/build", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Build failed");
      setResult({ url: data.url, html: data.html, sections: data.meta?.sections ?? 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Build failed");
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    if (!result) return;
    navigator.clipboard.writeText(origin + result.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function download() {
    if (!result) return;
    const blob = new Blob([result.html], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "rebuilt.html";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <main className="wrap">
      <h1>Site Rebuilder</h1>
      <p className="sub">
        Paste any URL. It crawls the page, rebuilds it with a better UI using Claude, saves the
        sections to your library, and gives you a live link. <a href="/compose">Open Composer →</a>
      </p>

      <form onSubmit={build} className="bar">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="example.com"
          aria-label="Website URL"
        />
        <button disabled={loading || !url.trim()}>
          {loading ? "Building…" : "Rebuild"}
        </button>
      </form>

      {loading && (
        <p className="note">Crawling and redesigning… this can take up to a minute.</p>
      )}
      {error && <p className="err">{error}</p>}

      {result && (
        <section className="result">
          <div className="linkbar">
            <a className="livelink" href={result.url} target="_blank" rel="noreferrer">
              {origin}
              {result.url}
            </a>
            <button onClick={copy}>{copied ? "Copied ✓" : "Copy link"}</button>
            <button onClick={download}>Download</button>
          </div>
          <p className="note">
            {result.sections} section{result.sections === 1 ? "" : "s"} saved to your library —{" "}
            <a href="/compose">mix &amp; match in the Composer →</a>
          </p>
          <iframe title="Preview" src={result.url} />
        </section>
      )}
    </main>
  );
}
