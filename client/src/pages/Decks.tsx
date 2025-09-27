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

export default function Decks() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [due, setDue] = useState<Card[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      return;
    }
    (async () => {
      try {
        setError(null);
        setLoading(true);
        const [c, q] = await Promise.all([listCards(selectedId), listDue(selectedId)]);
        setCards(c);
        setDue(q);
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

  const onReview = async (cardId: string, result: "again" | "gotit") => {
    try {
      setError(null);
      setLoading(true);
      await reviewCard(cardId, result);
      if (selectedId) {
        const q = await listDue(selectedId);
        setDue(q);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to review card");
    } finally {
      setLoading(false);
    }
  };

  const currentDue = due[0];

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
          <div style={{ background: "#ffe9e9", border: "1px solid #ffb3b3", padding: 8, borderRadius: 6, marginBottom: 12 }}>
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
            <div style={{ marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
              <strong>Study</strong>
              <span style={{ fontSize: 12, color: "#666" }}>
                Due now: {due.length}
              </span>
            </div>

            {!currentDue ? (
              <div style={{ fontSize: 14, color: "#666" }}>
                No cards due. Great job!
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>
                    Box {currentDue.leitner.box} • Next due:{" "}
                    {new Date(currentDue.leitner.nextReviewAt).toLocaleString()}
                  </div>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>
                    {currentDue.prompt}
                  </div>
                  <details>
                    <summary style={{ cursor: "pointer" }}>Show answer</summary>
                    <div style={{ marginTop: 6 }}>{currentDue.answer}</div>
                  </details>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => onReview(currentDue._id, "again")} style={{ padding: "8px 10px", borderRadius: 6 }}>
                    Again
                  </button>
                  <button onClick={() => onReview(currentDue._id, "gotit")} style={{ padding: "8px 10px", borderRadius: 6 }}>
                    Got it
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* cards list */}
          <section style={{ border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
            <strong>Cards in deck</strong>
            {!cards.length ? (
              <div style={{ fontSize: 14, color: "#666", marginTop: 6 }}>
                No cards yet.
              </div>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0", display: "grid", gap: 8 }}>
                {cards.map((c) => (
                  <li key={c._id} style={{ border: "1px solid #eee", borderRadius: 8, padding: 10 }}>
                    <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                      Box {c.leitner.box} • Next: {new Date(c.leitner.nextReviewAt).toLocaleString()} • Correct {c.stats.correct} / Incorrect {c.stats.incorrect}
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
