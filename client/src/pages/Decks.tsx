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

  const progress = session.length > 0 ? ((idx + 1) / session.length) * 100 : 0;

  return (
    <section style={{ 
      padding: 24,
      display: "grid",
      gridTemplateColumns: "300px 1fr",
      gap: 24,
      maxWidth: 1600,
      margin: '0 auto',
    }}>
      {/* Left Sidebar - Enhanced */}
      <aside style={{ 
        background: '#f9fafb',
        borderRadius: 16,
        padding: 20,
        height: 'fit-content',
        border: '1px solid #e5e7eb',
      }}>
        <h2 style={{ 
          marginTop: 0,
          marginBottom: 20,
          fontSize: 24,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          🎴 Decks
        </h2>

        {/* Create New Deck - Enhanced */}
        <div style={{ 
          display: "grid",
          gap: 10,
          marginBottom: 24,
          padding: 16,
          background: 'white',
          borderRadius: 12,
          border: '1px solid #e5e7eb',
        }}>
          <input
            placeholder="New deck name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onCreateDeck()}
            style={{ 
              padding: 10,
              border: "2px solid #e5e7eb",
              borderRadius: 8,
              fontSize: 14,
              transition: 'border-color 0.2s',
              outline: 'none',
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#f59e0b'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
          />
          <button
            onClick={onCreateDeck}
            disabled={!newName.trim() || loading}
            style={{ 
              padding: "10px 16px",
              borderRadius: 8,
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
              border: 'none',
              fontWeight: 600,
              cursor: !newName.trim() || loading ? 'not-allowed' : 'pointer',
              opacity: !newName.trim() || loading ? 0.6 : 1,
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
            }}
            onMouseEnter={(e) => {
              if (newName.trim() && !loading) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(245, 158, 11, 0.3)';
            }}
          >
            ✨ Create Deck
          </button>
        </div>

        {/* Deck List - Enhanced */}
        <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {decks.length ? `Your Decks (${decks.length})` : "No decks yet"}
        </div>
        <ul style={{ 
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "grid",
          gap: 8,
        }}>
          {decks.map((d) => (
            <li key={d._id}>
              <button
                onClick={() => setSelectedId(d._id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: 12,
                  borderRadius: 10,
                  border: selectedId === d._id ? "2px solid #f59e0b" : "2px solid transparent",
                  background: selectedId === d._id ? "white" : "transparent",
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: selectedId === d._id ? '0 2px 8px rgba(245, 158, 11, 0.15)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (selectedId !== d._id) {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedId !== d._id) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                  }
                }}
              >
                <div style={{ 
                  fontWeight: 600,
                  fontSize: 14,
                  marginBottom: 4,
                  color: selectedId === d._id ? '#f59e0b' : '#111827',
                }}>
                  {d.name}
                </div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>
                  {new Date(d.createdAt).toLocaleDateString()}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Main Content Area - Enhanced */}
      <div>
        {/* Error Display - Enhanced */}
        {error && (
          <div
            style={{
              background: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
              border: "1px solid #fca5a5",
              padding: 16,
              borderRadius: 12,
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.1)',
            }}
          >
            <span style={{ fontSize: 20 }}>⚠️</span>
            <span style={{ color: "#991b1b", fontWeight: 500 }}>{error}</span>
          </div>
        )}

        {/* Deck Header - Enhanced */}
        <div style={{ 
          display: "flex",
          alignItems: "center",
          justifyContent: 'space-between',
          marginBottom: 24,
          padding: 20,
          background: 'white',
          borderRadius: 16,
          border: '1px solid #e5e7eb',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}>
          <h3 style={{ 
            margin: 0,
            fontSize: 28,
            fontWeight: 700,
            flex: 1,
          }}>
            {selectedDeck ? selectedDeck.name : "📚 Select a deck"}
          </h3>
          {loading && (
            <div style={{ 
              fontSize: 13,
              color: "#f59e0b",
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
              Loading…
            </div>
          )}
        </div>

        {/* Study Session Card - Enhanced */}
        <div style={{ 
          background: 'white',
          borderRadius: 16,
          border: '1px solid #e5e7eb',
          padding: 24,
          marginBottom: 20,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}>
          <div
            style={{
              marginBottom: 20,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h4 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
                📖 Study Session
              </h4>
              <div style={{
                display: 'flex',
                gap: 8,
                fontSize: 12,
                fontWeight: 600,
              }}>
                <span style={{
                  padding: '4px 10px',
                  background: '#fef3c7',
                  color: '#92400e',
                  borderRadius: 12,
                }}>
                  {due.length} due
                </span>
                <span style={{
                  padding: '4px 10px',
                  background: '#e0e7ff',
                  color: '#3730a3',
                  borderRadius: 12,
                }}>
                  {cards.length} total
                </span>
              </div>
            </div>
            
            <div style={{ display: "flex", gap: 10 }}>
              <button
                data-testid="study-due-button"
                disabled={!selectedId || loading || due.length === 0}
                onClick={() => startSession("due")}
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  background: !selectedId || loading || due.length === 0
                    ? '#d1d5db'
                    : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white',
                  border: 'none',
                  fontWeight: 600,
                  cursor: !selectedId || loading || due.length === 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: !selectedId || loading || due.length === 0 ? 'none' : '0 2px 8px rgba(245, 158, 11, 0.3)',
                }}
                onMouseEnter={(e) => {
                  if (selectedId && !loading && due.length > 0) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = !selectedId || loading || due.length === 0 ? 'none' : '0 2px 8px rgba(245, 158, 11, 0.3)';
                }}
              >
                🎯 Study Due
              </button>
              <button
                data-testid="study-all-button"
                disabled={!selectedId || loading || cards.length === 0}
                onClick={() => startSession("all")}
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  background: 'white',
                  color: '#374151',
                  border: '2px solid #e5e7eb',
                  fontWeight: 600,
                  cursor: !selectedId || loading || cards.length === 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: !selectedId || loading || cards.length === 0 ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (selectedId && !loading && cards.length > 0) {
                    e.currentTarget.style.background = '#f3f4f6';
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              >
                📚 Study All
              </button>
            </div>
          </div>

          {/* Study Card Display */}
          {!current ? (
            <div style={{ 
              textAlign: 'center',
              padding: 60,
              background: '#f9fafb',
              borderRadius: 12,
              border: '2px dashed #e5e7eb',
            }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>
                {session.length === 0 ? "🎴" : "🎉"}
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                {session.length === 0
                  ? "Ready to Study?"
                  : "Session Complete!"}
              </div>
              <div style={{ fontSize: 14, color: "#6b7280" }}>
                {session.length === 0
                  ? "Click a study button above to begin"
                  : "Great work! All cards reviewed."}
              </div>
            </div>
          ) : (
            <div>
              {/* Progress Bar */}
              <div style={{ marginBottom: 20 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#6b7280',
                }}>
                  <span>Card {idx + 1} of {session.length}</span>
                  <span>{Math.round(progress)}% Complete</span>
                </div>
                <div style={{
                  height: 10,
                  background: "#e5e7eb",
                  borderRadius: 999,
                  overflow: "hidden",
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)'
                }}>
                  <div style={{
                    width: `${progress}%`,
                    height: "100%",
                    background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
                    transition: 'width 0.3s ease',
                    borderRadius: 999,
                  }} />
                </div>
              </div>

              {/* Card Metadata */}
              <div style={{
                display: 'flex',
                gap: 12,
                marginBottom: 20,
                fontSize: 12,
                fontWeight: 600,
                flexWrap: 'wrap',
              }}>
                <span style={{
                  padding: '6px 12px',
                  background: '#e0e7ff',
                  color: '#3730a3',
                  borderRadius: 8,
                }}>
                  📦 Box {current.leitner.box}
                </span>
                <span style={{
                  padding: '6px 12px',
                  background: '#fef3c7',
                  color: '#92400e',
                  borderRadius: 8,
                }}>
                  ⏰ Next: {new Date(current.leitner.nextReviewAt).toLocaleDateString()}
                </span>
              </div>

              {/* Flashcard */}
              <div style={{
                background: 'linear-gradient(135deg, #fafafa 0%, #f3f4f6 100%)',
                border: '2px solid #e5e7eb',
                borderRadius: 16,
                padding: 32,
                marginBottom: 20,
                minHeight: 200,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              }}>
                <div style={{
                  fontSize: 20,
                  fontWeight: 600,
                  marginBottom: 20,
                  lineHeight: 1.6,
                  color: '#111827',
                }}>
                  {current.prompt}
                </div>

                {showAnswer && (
                  <div style={{
                    marginTop: 20,
                    paddingTop: 20,
                    borderTop: '2px dashed #d1d5db',
                  }}>
                    <div style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#10b981',
                      marginBottom: 12,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}>
                      ✓ Answer
                    </div>
                    <div style={{
                      fontSize: 16,
                      lineHeight: 1.6,
                      whiteSpace: "pre-wrap",
                      color: '#374151',
                    }}>
                      {current.answer}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {!showAnswer ? (
                <button
                  data-testid="show-answer-button"
                  onClick={() => setShowAnswer(true)}
                  style={{
                    width: '100%',
                    padding: "16px 24px",
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: 16,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                  }}
                >
                  👀 Show Answer
                </button>
              ) : (
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    data-testid="again-button"
                    onClick={handleAgain}
                    style={{
                      flex: 1,
                      padding: "16px 24px",
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      color: 'white',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: 16,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                    }}
                  >
                    ❌ Again
                  </button>
                  <button
                    data-testid="got-it-button"
                    onClick={handleGotIt}
                    style={{
                      flex: 1,
                      padding: "16px 24px",
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: 16,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                    }}
                  >
                    ✓ Got It
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cards List - Enhanced */}
        <div style={{ 
          background: 'white',
          borderRadius: 16,
          border: '1px solid #e5e7eb',
          padding: 24,
        }}>
          <h4 style={{ 
            marginTop: 0,
            marginBottom: 16,
            fontSize: 18,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            🗂️ Cards in Deck
            {cards.length > 0 && (
              <span style={{ 
                fontSize: 12,
                fontWeight: 600,
                background: '#f59e0b',
                color: 'white',
                padding: '4px 10px',
                borderRadius: 12,
              }}>
                {cards.length}
              </span>
            )}
          </h4>

          {!cards.length ? (
            <div style={{ 
              textAlign: 'center',
              padding: 40,
              background: '#f9fafb',
              borderRadius: 12,
              border: '2px dashed #e5e7eb',
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
              <div style={{ fontSize: 14, color: "#9ca3af" }}>
                No cards yet. Add cards from the Documents page.
              </div>
            </div>
          ) : (
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "grid",
                gap: 12,
              }}
            >
              {cards.map((c) => (
                <li
                  key={c._id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: 16,
                    background: '#fafafa',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fafafa';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    gap: 10,
                    marginBottom: 12,
                    fontSize: 11,
                    fontWeight: 600,
                    flexWrap: 'wrap',
                  }}>
                    <span style={{
                      padding: '4px 8px',
                      background: '#e0e7ff',
                      color: '#3730a3',
                      borderRadius: 6,
                    }}>
                      Box {c.leitner.box}
                    </span>
                    <span style={{
                      padding: '4px 8px',
                      background: '#fef3c7',
                      color: '#92400e',
                      borderRadius: 6,
                    }}>
                      Next: {new Date(c.leitner.nextReviewAt).toLocaleDateString()}
                    </span>
                    <span style={{
                      padding: '4px 8px',
                      background: '#d1fae5',
                      color: '#065f46',
                      borderRadius: 6,
                    }}>
                      ✓ {c.stats.correct}
                    </span>
                    <span style={{
                      padding: '4px 8px',
                      background: '#fee2e2',
                      color: '#991b1b',
                      borderRadius: 6,
                    }}>
                      ✗ {c.stats.incorrect}
                    </span>
                  </div>
                  <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 15 }}>
                    {c.prompt}
                  </div>
                  <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
                    {c.answer}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}