"use client";

import { useEffect, useState } from "react";

type Comp = { id: string; type: string; label: string; sourceUrl: string; createdAt: string };

export default function Compose() {
  const [comps, setComps] = useState<Comp[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [building, setBuilding] = useState(false);
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState("");
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    fetch("/api/components")
      .then((r) => r.json())
      .then((d) => setComps(d.components || []))
      .catch(() => setError("Could not load the library"));
  }, []);

  const byId = (id: string) => comps.find((c) => c.id === id);

  function add(id: string) {
    setSelected((s) => [...s, id]);
  }
  function removeAt(i: number) {
    setSelected((s) => s.filter((_, idx) => idx !== i));
  }
  function move(i: number, dir: -1 | 1) {
    setSelected((s) => {
      const j = i + dir;
      if (j < 0 || j >= s.length) return s;
      const copy = [...s];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }

  async function compose() {
    setBuilding(true);
    setError("");
    setResult("");
    try {
      const res = await fetch("/api/compose", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ids: selected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Compose failed");
      setResult(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Compose failed");
    } finally {
      setBuilding(false);
    }
  }

  return (
    <main className="wrap">
      <p className="sub">
        <a href="/" className="back">← Rebuilder</a>
      </p>
      <h1>Composer</h1>
      <p className="sub">
        Mix &amp; match saved sections into a new page. No API call — this just assembles what you
        picked. Build sites in the <a href="/">Rebuilder</a> to fill the library.
      </p>

      {error && <p className="err">{error}</p>}

      <div className="compose-grid">
        <section>
          <h3 className="col-title">Library ({comps.length})</h3>
          {comps.length === 0 && <p className="note">No sections yet — rebuild a site first.</p>}
          <div className="lib">
            {comps.map((c) => (
              <div key={c.id} className="comp">
                <div className="comp-head">
                  <span className="tag">{c.type}</span>
                  <button className="mini" onClick={() => add(c.id)}>
                    Add
                  </button>
                </div>
                <div className="comp-label">{c.label}</div>
                <iframe className="thumb" src={`/c/${c.id}`} title={c.label} loading="lazy" />
                <div className="comp-src">{c.sourceUrl}</div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="col-title">Your page ({selected.length})</h3>
          {selected.length === 0 && <p className="note">Add sections from the library.</p>}
          <ol className="picked">
            {selected.map((id, i) => {
              const c = byId(id);
              return (
                <li key={`${id}-${i}`}>
                  <span className="tag">{c?.type}</span>
                  <span className="picked-label">{c?.label}</span>
                  <span className="picked-actions">
                    <button className="mini" onClick={() => move(i, -1)} disabled={i === 0}>
                      ↑
                    </button>
                    <button
                      className="mini"
                      onClick={() => move(i, 1)}
                      disabled={i === selected.length - 1}
                    >
                      ↓
                    </button>
                    <button className="mini" onClick={() => removeAt(i)}>
                      ✕
                    </button>
                  </span>
                </li>
              );
            })}
          </ol>
          <button onClick={compose} disabled={building || selected.length === 0}>
            {building ? "Building…" : "Build page"}
          </button>

          {result && (
            <div className="result">
              <div className="linkbar">
                <a className="livelink" href={result} target="_blank" rel="noreferrer">
                  {origin}
                  {result}
                </a>
              </div>
              <iframe title="Composed preview" src={result} />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
