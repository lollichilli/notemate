import { useEffect, useMemo, useState } from "react";
import {
  listDecks,
  createDeck,
  listCards,
  listDue,
  reviewCard,
  type Deck,
  type Card,
} from "../lib/decks";

type StudyMode = "due" | "all";

export default function Decks() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [due, setDue] = useState<Card[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<StudyMode>("due");
  const [session, setSession] = useState<Card[]>([]);
  const [idx, setIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const selectedDeck = useMemo(
    () => decks.find((d) => d._id === selectedId) ?? null,
    [decks, selectedId]
  );

  useEffect(() => {
    (async () => {
      try {
        setError(null);
        const d = await listDecks();
        setDecks(d);
        if (d.length && !selectedId) setSelectedId(d[0]._id);
      } catch (e: any) {
        setError(e?.message || "Failed to load decks");
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setCards([]);
      setDue([]);
      setSession([]);
      setIdx(0);
      setShowAnswer(false);
      return;
    }
    (async () => {
      try {
        setError(null);
        setLoading(true);
        const [c, q] = await Promise.all([listCards(selectedId), listDue(selectedId)]);
        setCards(c);
        setDue(q);
        setSession([]);
        setIdx(0);
        setShowAnswer(false);
      } catch (e: any) {
        setError(e?.message || "Failed to load deck data");
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedId]);

  const onCreateDeck = async () => {
    if (!newName.trim()) return;
    try {
      setError(null);
      setLoading(true);
      const deck = await createDeck(newName.trim());
      setDecks((prev) => [deck, ...prev]);
      setSelectedId(deck._id);
      setNewName("");
    } catch (e: any) {
      setError(e?.message || "Failed to create deck");
    } finally {
      setLoading(false);
    }
  };

  async function startSession(nextMode: StudyMode) {
    if (!selectedId) return;
    try {
      setLoading(true);
      setError(null);
      setMode(nextMode);
      const seed = nextMode === "due" ? await listDue(selectedId) : await listCards(selectedId);
      setSession(seed);
      setIdx(0);
      setShowAnswer(false);
    } catch (e: any) {
      setError(e?.message || "Failed to start session");
    } finally {
      setLoading(false);
    }
  }

  const current = session[idx] ?? null;

  async function handleAgain() {
    if (!current) return;
    try {
      await reviewCard(current._id, "again");
    } catch {
    }
    setSession((prev) => {
      if (prev.length <= 1) return prev;
      const copy = prev.slice();
      const [card] = copy.splice(idx, 1);
      copy.push(card);
      return copy;
    });
    setShowAnswer(false);
    if (selectedId) {
      listDue(selectedId).then(setDue).catch(() => {});
    }
  }

  async function handleGotIt() {
    if (!current) return;
    try {
      await reviewCard(current._id, "good");
    } catch {
    }
    setSession((prev) => {
      const copy = prev.slice();
      copy.splice(idx, 1);
      if (idx >= copy.length) setIdx(Math.max(0, copy.length - 1));
      return copy;
    });
    setShowAnswer(false);
    if (selectedId) {
      Promise.all([listCards(selectedId), listDue(selectedId)])
        .then(([c, q]) => {
          setCards(c);
          setDue(q);
        })
        .catch(() => {});
    }
  }

  return (
    <section style={{ padding: 16, display: "grid", gridTemplateColumns: "280px 1fr", gap: 16 }}>
      {/* left: decks list + create */}
      <aside style={{ borderRight: "1px solid #eee", paddingRight: 12 }}>
        <h2 style={{ marginTop: 0 }}>Decks</h2>

        <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
          <input
            placeholder="New deck name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6 }}
          />
          <button onClick={onCreateDeck} style={{ padding: "8px 10px", borderRadius: 6 }}>
            Create Deck
          </button>
        </div>

        <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
          {decks.length ? "Your decks:" : "No decks yet."}
        </div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 6 }}>
          {decks.map((d) => (
            <li key={d._id}>
              <button
                onClick={() => setSelectedId(d._id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: 8,
                  borderRadius: 6,
                  border: "1px solid #eee",
                  background: selectedId === d._id ? "#f5f7ff" : "white",
                }}
              >
                <div style={{ fontWeight: 600 }}>{d.name}</div>
                <div style={{ fontSize: 12, color: "#666" }}>
                  {new Date(d.createdAt).toLocaleString()}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* right: Cards & Study */}
      <div>
        {error && (
          <div
            style={{
              background: "#ffe9e9",
              border: "1px solid #ffb3b3",
              padding: 8,
              borderRadius: 6,
              marginBottom: 12,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h3 style={{ margin: 0, flex: 1 }}>
            {selectedDeck ? selectedDeck.name : "No deck selected"}
          </h3>
          {loading && <span style={{ fontSize: 12, color: "#666" }}>Loading…</span>}
        </div>

        <div style={{ display: "grid", gap: 16, marginTop: 12 }}>
          {/* study panel */}
          <section style={{ border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
            <div
              style={{
                marginBottom: 8,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
              }}
            >
              <strong>Study</strong>
              <div style={{ display: "flex", gap: 8 }}>
                <button disabled={!selectedId || loading} onClick={() => startSession("due")}>
                  Study due
                </button>
                <button disabled={!selectedId || loading} onClick={() => startSession("all")}>
                  Study all
                </button>
              </div>
              <span style={{ fontSize: 12, color: "#666" }}>
                Mode: {mode} • Due now: {due.length} • In session: {session.length}
              </span>
            </div>

            {!current ? (
              <div style={{ fontSize: 14, color: "#666" }}>
                {session.length === 0
                  ? "No cards in session. Click “Study due” or “Study all”."
                  : "Session complete. Nice work!"}
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>
                  Card {idx + 1} / {session.length} • Box {current.leitner.box} • Next{" "}
                  {new Date(current.leitner.nextReviewAt).toLocaleString()}
                </div>

                <div style={{ fontWeight: 600, marginBottom: 6 }}>{current.prompt}</div>

                {!showAnswer ? (
                  <button onClick={() => setShowAnswer(true)} style={{ marginBottom: 8 }}>
                    Show answer
                  </button>
                ) : (
                  <>
                    <div style={{ marginBottom: 10, whiteSpace: "pre-wrap" }}>{current.answer}</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={handleAgain}>Again</button>
                      <button onClick={handleGotIt}>Got it</button>
                    </div>
                  </>
                )}
              </div>
            )}
          </section>

          {/* cards list */}
          <section style={{ border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
            <strong>Cards in deck</strong>
            {!cards.length ? (
              <div style={{ fontSize: 14, color: "#666", marginTop: 6 }}>No cards yet.</div>
            ) : (
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "8px 0 0",
                  display: "grid",
                  gap: 8,
                }}
              >
                {cards.map((c) => (
                  <li key={c._id} style={{ border: "1px solid #eee", borderRadius: 8, padding: 10 }}>
                    <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                      Box {c.leitner.box} • Next:{" "}
                      {new Date(c.leitner.nextReviewAt).toLocaleString()} • Correct{" "}
                      {c.stats.correct} / Incorrect {c.stats.incorrect}
                    </div>
                    <div style={{ fontWeight: 600 }}>{c.prompt}</div>
                    <div style={{ marginTop: 4 }}>{c.answer}</div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}
