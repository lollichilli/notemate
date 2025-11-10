import { useEffect, useMemo, useState } from "react";
import {
  listDocuments,
  createDocument,
  parseMarkdown,
  listBlocks,
  getDocument,
  uploadPdfAndParse,
  type Doc,
  type DocBlock,
} from "../lib/documents";
import { listDecks, createCard, type Deck } from "../lib/decks";
import { generateFlashcardsFromDocument, type GeneratedFlashcard } from "../lib/flashcards";
import {
  generateQuizFromDocument,
  createQuiz,
  type QuizQuestion,
} from "../lib/quizzes";
import { useAuth } from "../contexts/AuthContext";

export default function Documents() {
  const { token } = useAuth();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<DocBlock[]>([]);
  const [title, setTitle] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI Generation states
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateType, setGenerateType] = useState<'qa' | 'mc'>('qa');
  const [generateCount, setGenerateCount] = useState<5 | 10 | 20>(10);
  const [generating, setGenerating] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<GeneratedFlashcard[]>([]);
  const [selectedCards, setSelectedCards] = useState<Set<number>>(new Set());
  const [showReviewModal, setShowReviewModal] = useState(false);

  const { user } = useAuth();

  const [decks, setDecks] = useState<Deck[]>([]);
  const [deckIdForNewCard, setDeckIdForNewCard] = useState<string | null>(null);

  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [cardPrompt, setCardPrompt] = useState("");
  const [cardAnswer, setCardAnswer] = useState("");

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfName, setPdfName] = useState<string>("");
  const [pdfStatus, setPdfStatus] = useState<string>("");

  // Quiz generation states
  const [showGenerateQuizModal, setShowGenerateQuizModal] = useState(false);
  const [quizType, setQuizType] = useState<'mcq' | 'true-false' | 'mixed'>('mcq');
  const [quizCount, setQuizCount] = useState<5 | 10 | 15 | 20>(10);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [generatedQuizQuestions, setGeneratedQuizQuestions] = useState<QuizQuestion[]>([]);
  const [showReviewQuizModal, setShowReviewQuizModal] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');

  function onPickFile(file: File) {
    setPdfStatus("");
    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (isPdf) {
      setPdfFile(file);
      setPdfName(file.name);
    } else {
      setPdfFile(null);
      setPdfName("");
      readFileAsText(file)
        .then((text) => setMarkdown(text))
        .catch((e) => setError(e?.message || "Failed to read file"));
    }
  }

  async function onParsePdf() {
    if (!selectedId || !pdfFile) return;
    try {
      setLoading(true);
      setError(null);
      setPdfStatus("Parsing…");
      const resp = await uploadPdfAndParse(selectedId, pdfFile);
      setPdfStatus(
        resp?.ok
          ? `Parsed: ${resp.blocksCreated ?? 0} blocks${
              resp.textLength ? ` (${resp.textLength} chars)` : ""
            }`
          : "Parsed (no details)"
      );
      const [doc, b] = await Promise.all([getDocument(selectedId), listBlocks(selectedId)]);
      setBlocks(b);
      const raw = (doc as any)?.source?.rawText as string | undefined;
      setMarkdown(raw && raw.trim().length ? raw : "");
    } catch (e: any) {
      setPdfStatus(e?.message || "Failed to parse PDF");
      setError(e?.message || "Failed to parse PDF");
    } finally {
      setLoading(false);
    }
  }

  async function readFileAsText(file: File): Promise<string> {
    return await file.text();
  }

  const selectedDoc = useMemo(
    () => docs.find((d) => d._id === selectedId) ?? null,
    [docs, selectedId]
  );

  function blocksToMarkdown(b: DocBlock[]): string {
    return b
      .map((blk) => {
        if (blk.type === "heading") return `# ${blk.text}`;
        if (blk.type === "list")
          return blk.text.split("\n").map((i) => `- ${i}`).join("\n");
        return blk.text;
      })
      .join("\n\n");
  }

  useEffect(() => {
    (async () => {
      try {
        setError(null);
        const data = await listDocuments();
        setDocs(data);
        if (data.length && !selectedId) setSelectedId(data[0]._id);
      } catch (e: any) {
        setError(e?.message || "Failed to load documents");
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setBlocks([]);
      setMarkdown("");
      return;
    }
    (async () => {
      try {
        setError(null);
        setLoading(true);
        const [doc, b] = await Promise.all([
          getDocument(selectedId),
          listBlocks(selectedId),
        ]);
        setBlocks(b);
        const raw = (doc as any)?.source?.rawText as string | undefined;
        setMarkdown(raw && raw.trim().length ? raw : blocksToMarkdown(b));
      } catch (e: any) {
        setError(e?.message || "Failed to load document");
        setBlocks([]);
        setMarkdown("");
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedId]);

  const onCreate = async () => {
    if (!title.trim()) return;
    try {
      setError(null);
      setLoading(true);
      const doc = await createDocument(title.trim());
      setDocs((d) => [doc, ...d]);
      setSelectedId(doc._id);
      setTitle("");
      setMarkdown("");
      setBlocks([]);
    } catch (e: any) {
      setError(e?.message || "Failed to create document");
    } finally {
      setLoading(false);
    }
  };

  const onParse = async () => {
    if (!selectedId) {
      setError("Select or create a document first");
      return;
    }
    if (!markdown.trim()) {
      setError("Paste some Markdown before parsing");
      return;
    }
    try {
      setError(null);
      setLoading(true);
      await parseMarkdown(selectedId, markdown);
      const b = await listBlocks(selectedId);
      setBlocks(b);
    } catch (e: any) {
      setError(e?.message || "Failed to parse markdown");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const d = await listDecks();
        setDecks(d);
        if (d.length && !deckIdForNewCard) setDeckIdForNewCard(d[0]._id);
      } catch {
      }
    })();
  }, []);

  function startAddCardFromBlock(block: DocBlock) {
    setEditingBlockId(block._id);
    setCardPrompt(block.text);
    setCardAnswer("");
  }
  function cancelAddCard() {
    setEditingBlockId(null);
    setCardPrompt("");
    setCardAnswer("");
  }
  async function saveCardFromBlock(block: DocBlock) {
    if (!deckIdForNewCard) {
      setError("Create or select a deck first");
      return;
    }
    if (!cardPrompt.trim() || !cardAnswer.trim()) {
      setError("Prompt and answer are required");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await createCard(deckIdForNewCard, {
        type: "basic",
        prompt: cardPrompt.trim(),
        answer: cardAnswer.trim(),
        blockId: block._id,
      });
      cancelAddCard();
    } catch (e: any) {
      setError(e?.message || "Failed to create card");
    } finally {
      setLoading(false);
    }
  }

  async function onGenerateFlashcards() {
    if (!selectedId || !user) return;
    
    try {
      setGenerating(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const cards = await generateFlashcardsFromDocument(
        selectedId,
        generateType,
        generateCount,
        token
      );
      
      setGeneratedCards(cards);
      setSelectedCards(new Set(cards.map((_, i) => i)));
      setShowGenerateModal(false);
      setShowReviewModal(true);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to generate flashcards');
    } finally {
      setGenerating(false);
    }
  }

  function toggleCardSelection(index: number) {
    const newSet = new Set(selectedCards);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSelectedCards(newSet);
  }

  async function addSelectedCardsToDeck() {
    if (!deckIdForNewCard) {
      setError('Select a deck first');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      for (const index of selectedCards) {
        const card = generatedCards[index];
        
        if (card.type === 'qa') {
          await createCard(deckIdForNewCard, {
            type: 'basic',
            prompt: card.question,
            answer: card.answer,
          });
        } else {
          const answerText = `Correct: ${card.options[card.correctIndex]}\n\nAll options:\n${card.options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}${card.explanation ? `\n\nExplanation: ${card.explanation}` : ''}`;
          
          await createCard(deckIdForNewCard, {
            type: 'basic',
            prompt: card.question,
            answer: answerText,
          });
        }
      }

      alert(`Added ${selectedCards.size} flashcards to deck!`);
      setShowReviewModal(false);
      setGeneratedCards([]);
      setSelectedCards(new Set());
    } catch (e: any) {
      setError(e?.message || 'Failed to add cards');
    } finally {
      setLoading(false);
    }
  }

  async function onGenerateQuiz() {
    if (!selectedId || !token) return;
    
    try {
      setGeneratingQuiz(true);
      setError(null);
      
      const result = await generateQuizFromDocument(
        selectedId,
        quizType,
        quizCount,
        token
      );
      
      setGeneratedQuizQuestions(result.questions);
      setQuizTitle(selectedDoc?.title ? `${selectedDoc.title} Quiz` : 'Quiz');
      setShowGenerateQuizModal(false);
      setShowReviewQuizModal(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to generate quiz');
    } finally {
      setGeneratingQuiz(false);
    }
  }

  async function saveQuiz() {
    if (!selectedId || !token || !quizTitle.trim()) {
      setError('Quiz title is required');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await createQuiz(
        {
          title: quizTitle.trim(),
          documentId: selectedId,
          questions: generatedQuizQuestions,
        },
        token
      );
      
      alert('Quiz saved successfully! Go to the Quizzes page to take it.');
      setShowReviewQuizModal(false);
      setGeneratedQuizQuestions([]);
      setQuizTitle('');
    } catch (e: any) {
      setError(e?.message || 'Failed to save quiz');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      style={{
        padding: 24,
        display: "grid",
        gridTemplateColumns: "300px 1fr",
        gap: 24,
        maxWidth: 1600,
        margin: '0 auto',
      }}
    >
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
          📄 Documents
        </h2>

        {/* Create New Document - Enhanced */}
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
            placeholder="New document title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onCreate()}
            style={{ 
              padding: 10,
              border: "2px solid #e5e7eb",
              borderRadius: 8,
              fontSize: 14,
              transition: 'border-color 0.2s',
              outline: 'none',
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
          />
          <button
            onClick={onCreate}
            disabled={!title.trim() || loading}
            style={{ 
              padding: "10px 16px",
              borderRadius: 8,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              fontWeight: 600,
              cursor: !title.trim() || loading ? 'not-allowed' : 'pointer',
              opacity: !title.trim() || loading ? 0.6 : 1,
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
            }}
            onMouseEnter={(e) => {
              if (title.trim() && !loading) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
            }}
          >
            ✨ Create Document
          </button>
        </div>

        {/* Document List - Enhanced */}
        <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {docs.length ? `Your Documents (${docs.length})` : "No documents yet"}
        </div>
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "grid",
            gap: 8,
          }}
        >
          {docs.map((d) => (
            <li key={d._id}>
              <button
                onClick={() => setSelectedId(d._id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: 12,
                  borderRadius: 10,
                  border: selectedId === d._id ? "2px solid #667eea" : "2px solid transparent",
                  background: selectedId === d._id ? "white" : "transparent",
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: selectedId === d._id ? '0 2px 8px rgba(102, 126, 234, 0.15)' : 'none',
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
                  color: selectedId === d._id ? '#667eea' : '#111827',
                }}>
                  {d.title}
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

        {/* Document Header - Enhanced */}
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
            {selectedDoc ? selectedDoc.title : "📝 Select a document"}
          </h3>
          {loading && (
            <div style={{ 
              fontSize: 13,
              color: "#667eea",
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

        {/* File Upload Section - Enhanced */}
        <div
          style={{
            background: "white",
            borderRadius: 16,
            border: "1px solid #e5e7eb",
            padding: 20,
            marginBottom: 20,
          }}
        >
          <h4
            style={{
              marginTop: 0,
              marginBottom: 16,
              fontSize: 16,
              fontWeight: 700,
              color: "#374151",
            }}
          >
            📎 Upload Content
          </h4>

          <div style={{ display: "grid", gap: 12 }}>
            {/* Hidden native input */}
            <input
              id="fileUpload"
              type="file"
              accept=".md,.markdown,.txt,.pdf"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.currentTarget.value = "";
                if (!f) return;
                onPickFile(f);
              }}
              style={{ display: "none" }} // 👈 Hide default file input
            />

            {/* Custom styled label acts as button */}
            <label
              htmlFor="fileUpload"
              style={{
                display: "inline-block",
                background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                color: "white",
                padding: "10px 18px",
                borderRadius: 8,
                fontWeight: 600,
                textAlign: "center",
                cursor: "pointer",
                width: "fit-content",
                transition: "transform 0.1s ease, box-shadow 0.2s ease",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = "scale(0.97)";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              Choose File
            </label>

            {pdfFile ? (
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  padding: 12,
                  background: "#f9fafb",
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                }}
              >
                <span style={{ fontSize: 12, color: "#6b7280", flex: 1 }}>
                  📄 <strong>{pdfName}</strong>
                </span>
                <button
                  onClick={onParsePdf}
                  disabled={!selectedId || !pdfFile || loading}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    background:
                      "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "white",
                    border: "none",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor:
                      !selectedId || !pdfFile || loading
                        ? "not-allowed"
                        : "pointer",
                    opacity:
                      !selectedId || !pdfFile || loading ? 0.6 : 1,
                    transition: "all 0.2s",
                  }}
                >
                  Parse PDF
                </button>
                {pdfStatus && (
                  <span
                    style={{
                      fontSize: 12,
                      color: "#059669",
                      fontWeight: 500,
                    }}
                  >
                    {pdfStatus}
                  </span>
                )}
              </div>
            ) : (
              <div
                style={{
                  fontSize: 12,
                  color: "#9ca3af",
                  padding: 8,
                  fontStyle: "italic",
                }}
              >
                💡 Tip: Upload a PDF to automatically extract and parse content
              </div>
            )}
          </div>
        </div>

        {/* Markdown Editor Section - Enhanced */}
        <div style={{ 
          background: 'white',
          borderRadius: 16,
          border: '1px solid #e5e7eb',
          padding: 20,
          marginBottom: 20,
        }}>
          <h4 style={{ marginTop: 0, marginBottom: 16, fontSize: 16, fontWeight: 700, color: '#374151' }}>
            ✏️ Markdown Editor
          </h4>
          
          <textarea
            placeholder="# Paste or type Markdown here
            
## Example heading
- Bullet point 1
- Bullet point 2

This is a paragraph of text."
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            rows={12}
            style={{
              width: "100%",
              padding: 16,
              border: "2px solid #e5e7eb",
              borderRadius: 12,
              fontFamily: "ui-monospace, 'Courier New', monospace",
              fontSize: 14,
              lineHeight: 1.6,
              resize: 'vertical',
              transition: 'border-color 0.2s',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#667eea';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />

          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button
              onClick={onParse}
              disabled={!selectedId || !markdown.trim() || loading}
              style={{ 
                padding: "12px 20px",
                borderRadius: 10,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                fontWeight: 600,
                cursor: !selectedId || !markdown.trim() || loading ? 'not-allowed' : 'pointer',
                opacity: !selectedId || !markdown.trim() || loading ? 0.6 : 1,
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
              }}
              onMouseEnter={(e) => {
                if (selectedId && markdown.trim() && !loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
              }}
            >
              🔄 Parse Markdown
            </button>
            
            <button
              onClick={() => setShowGenerateQuizModal(true)}
              disabled={!selectedId || blocks.length === 0 || loading}
              style={{ 
                padding: "12px 20px",
                borderRadius: 10,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                fontWeight: 600,
                cursor: !selectedId || blocks.length === 0 || loading ? 'not-allowed' : 'pointer',
                opacity: !selectedId || blocks.length === 0 || loading ? 0.6 : 1,
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              }}
              onMouseEnter={(e) => {
                if (selectedId && blocks.length > 0 && !loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
              }}
            >
              🤖 Generate Quiz with AI
            </button>
          </div>
        </div>

        {/* Deck Selector - Enhanced */}
        {decks.length > 0 ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 20,
              padding: 16,
              background: '#f9fafb',
              borderRadius: 12,
              border: '1px solid #e5e7eb',
            }}
          >
            <label style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>
              📚 Add cards to deck:
            </label>
            <select
              value={deckIdForNewCard ?? ""}
              onChange={(e) => setDeckIdForNewCard(e.target.value || null)}
              style={{ 
                padding: 10,
                border: "2px solid #e5e7eb",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {decks.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div style={{ 
            fontSize: 13,
            color: "#f59e0b",
            marginBottom: 20,
            padding: 12,
            background: '#fffbeb',
            borderRadius: 10,
            border: '1px solid #fcd34d',
          }}>
            ℹ️ No decks yet — create one on the Decks page first to add flashcards.
          </div>
        )}

        {/* Parsed Blocks Section - Enhanced */}
        <div style={{ 
          background: 'white',
          borderRadius: 16,
          border: '1px solid #e5e7eb',
          padding: 20,
        }}>
          <h4 style={{ marginTop: 0, marginBottom: 16, fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            📦 Parsed Blocks
            {blocks.length > 0 && (
              <span style={{ 
                fontSize: 12,
                fontWeight: 600,
                background: '#667eea',
                color: 'white',
                padding: '4px 10px',
                borderRadius: 12,
              }}>
                {blocks.length}
              </span>
            )}
          </h4>
          
          {!blocks.length ? (
            <div style={{ 
              fontSize: 14,
              color: "#9ca3af",
              textAlign: 'center',
              padding: 40,
              border: '2px dashed #e5e7eb',
              borderRadius: 12,
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
              No blocks yet. Parse some Markdown above or upload a PDF.
            </div>
          ) : (
            <ol style={{ 
              paddingLeft: 20,
              display: "grid",
              gap: 12,
              margin: 0,
            }}>
              {blocks.map((b) => (
                <li
                  key={b._id}
                  style={{ 
                    border: "1px solid #e5e7eb",
                    padding: 16,
                    borderRadius: 12,
                    background: '#f9fafb',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f9fafb';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      alignItems: 'start',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <span
                        style={{
                          fontSize: 11,
                          padding: "4px 8px",
                          borderRadius: 6,
                          border: "1px solid #d1d5db",
                          marginRight: 10,
                          background: "#ffffff",
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          color: '#6b7280',
                          letterSpacing: '0.5px',
                        }}
                      >
                        {b.type}
                      </span>
                      <span style={{ fontSize: 14, lineHeight: 1.6 }}>{b.text}</span>
                    </div>

                    <button
                      onClick={() => startAddCardFromBlock(b)}
                      style={{ 
                        padding: "8px 14px",
                        borderRadius: 8,
                        border: '2px solid #667eea',
                        background: 'white',
                        color: '#667eea',
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: !decks.length ? 'not-allowed' : 'pointer',
                        opacity: !decks.length ? 0.5 : 1,
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap',
                      }}
                      disabled={!decks.length}
                      onMouseEnter={(e) => {
                        if (decks.length) {
                          e.currentTarget.style.background = '#667eea';
                          e.currentTarget.style.color = 'white';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'white';
                        e.currentTarget.style.color = '#667eea';
                      }}
                    >
                      + Flashcard
                    </button>
                  </div>

                  {/* Card Editor - Enhanced */}
                  {editingBlockId === b._id && (
                    <div
                      style={{
                        marginTop: 16,
                        borderTop: "2px dashed #d1d5db",
                        paddingTop: 16,
                        background: 'white',
                        padding: 16,
                        borderRadius: 10,
                      }}
                    >
                      <div style={{ display: "grid", gap: 12 }}>
                        <input
                          value={cardPrompt}
                          onChange={(e) => setCardPrompt(e.target.value)}
                          placeholder="Front of card (question/prompt)"
                          style={{ 
                            padding: 12,
                            border: "2px solid #e5e7eb",
                            borderRadius: 8,
                            fontSize: 14,
                            transition: 'border-color 0.2s',
                            outline: 'none',
                          }}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                          onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                        />
                        <input
                          value={cardAnswer}
                          onChange={(e) => setCardAnswer(e.target.value)}
                          placeholder="Back of card (answer)"
                          style={{ 
                            padding: 12,
                            border: "2px solid #e5e7eb",
                            borderRadius: 8,
                            fontSize: 14,
                            transition: 'border-color 0.2s',
                            outline: 'none',
                          }}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                          onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                        />

                        <div style={{ display: "flex", gap: 10 }}>
                          <button
                            onClick={() => saveCardFromBlock(b)}
                            style={{ 
                              flex: 1,
                              padding: "10px 16px",
                              borderRadius: 8,
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              border: 'none',
                              fontWeight: 600,
                              cursor: !deckIdForNewCard || !cardPrompt.trim() || !cardAnswer.trim() ? 'not-allowed' : 'pointer',
                              opacity: !deckIdForNewCard || !cardPrompt.trim() || !cardAnswer.trim() ? 0.6 : 1,
                              transition: 'all 0.2s',
                            }}
                            disabled={
                              !deckIdForNewCard ||
                              !cardPrompt.trim() ||
                              !cardAnswer.trim()
                            }
                          >
                            ✓ Save to Deck
                          </button>
                          <button
                            onClick={cancelAddCard}
                            style={{ 
                              padding: "10px 16px",
                              borderRadius: 8,
                              border: '2px solid #e5e7eb',
                              background: 'white',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* MODALS - All modals remain the same functionality, just enhanced styling would go here */}
      {/* For brevity, I'll show just the quiz generation modal enhanced, but same pattern applies to all */}
      
      {/* Generate Quiz Modal - Enhanced */}
      {showGenerateQuizModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: 'white',
            padding: 32,
            borderRadius: 20,
            maxWidth: 450,
            width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <h3 style={{ 
              marginTop: 0,
              marginBottom: 8,
              fontSize: 24,
              fontWeight: 700,
            }}>
              🤖 Generate Quiz
            </h3>
            <p style={{ 
              margin: 0,
              marginBottom: 24,
              color: '#6b7280',
              fontSize: 14,
            }}>
              AI will create quiz questions from your document
            </p>
            
            <div style={{ display: 'grid', gap: 20 }}>
              <div>
                <label style={{ 
                  display: 'block',
                  marginBottom: 10,
                  fontWeight: 600,
                  fontSize: 14,
                  color: '#374151',
                }}>
                  Question Type:
                </label>
                <select
                  value={quizType}
                  onChange={(e) => setQuizType(e.target.value as 'mcq' | 'true-false' | 'mixed')}
                  style={{ 
                    width: '100%',
                    padding: 12,
                    border: "2px solid #e5e7eb",
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    outline: 'none',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                >
                  <option value="mcq">Multiple Choice</option>
                  <option value="true-false">True/False</option>
                  <option value="mixed">Mixed (All Types)</option>
                </select>
              </div>

              <div>
                <label style={{ 
                  display: 'block',
                  marginBottom: 10,
                  fontWeight: 600,
                  fontSize: 14,
                  color: '#374151',
                }}>
                  Number of Questions:
                </label>
                <select
                  value={quizCount}
                  onChange={(e) => setQuizCount(Number(e.target.value) as 5 | 10 | 15 | 20)}
                  style={{ 
                    width: '100%',
                    padding: 12,
                    border: "2px solid #e5e7eb",
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    outline: 'none',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                >
                  <option value={5}>5 questions</option>
                  <option value={10}>10 questions</option>
                  <option value={15}>15 questions</option>
                  <option value={20}>20 questions</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button
                  onClick={onGenerateQuiz}
                  disabled={generatingQuiz}
                  style={{
                    flex: 1,
                    padding: '14px 20px',
                    background: generatingQuiz 
                      ? '#d1d5db'
                      : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: generatingQuiz ? 'wait' : 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: generatingQuiz ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)',
                  }}
                  onMouseEnter={(e) => {
                    if (!generatingQuiz) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = generatingQuiz ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)';
                  }}
                >
                  {generatingQuiz ? '⏳ Generating...' : '✨ Generate Quiz'}
                </button>
                <button
                  onClick={() => setShowGenerateQuizModal(false)}
                  disabled={generatingQuiz}
                  style={{ 
                    padding: '14px 20px',
                    borderRadius: 10,
                    border: '2px solid #e5e7eb',
                    background: 'white',
                    fontWeight: 600,
                    cursor: generatingQuiz ? 'not-allowed' : 'pointer',
                    opacity: generatingQuiz ? 0.5 : 1,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!generatingQuiz) {
                      e.currentTarget.style.background = '#f3f4f6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate Flashcards Modal - Enhanced */}
      {showGenerateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: 'white',
            padding: 32,
            borderRadius: 20,
            maxWidth: 450,
            width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <h3 style={{ 
              marginTop: 0,
              marginBottom: 8,
              fontSize: 24,
              fontWeight: 700,
            }}>
              🎴 Generate Flashcards
            </h3>
            <p style={{ 
              margin: 0,
              marginBottom: 24,
              color: '#6b7280',
              fontSize: 14,
            }}>
              AI will create flashcards from your document
            </p>
            
            <div style={{ display: 'grid', gap: 20 }}>
              <div>
                <label style={{ 
                  display: 'block',
                  marginBottom: 10,
                  fontWeight: 600,
                  fontSize: 14,
                  color: '#374151',
                }}>
                  Card Type:
                </label>
                <select
                  value={generateType}
                  onChange={(e) => setGenerateType(e.target.value as 'qa' | 'mc')}
                  style={{ 
                    width: '100%',
                    padding: 12,
                    border: "2px solid #e5e7eb",
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    outline: 'none',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                >
                  <option value="qa">Question & Answer</option>
                  <option value="mc">Multiple Choice</option>
                </select>
              </div>

              <div>
                <label style={{ 
                  display: 'block',
                  marginBottom: 10,
                  fontWeight: 600,
                  fontSize: 14,
                  color: '#374151',
                }}>
                  Number of Cards:
                </label>
                <select
                  value={generateCount}
                  onChange={(e) => setGenerateCount(Number(e.target.value) as 5 | 10 | 20)}
                  style={{ 
                    width: '100%',
                    padding: 12,
                    border: "2px solid #e5e7eb",
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    outline: 'none',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                >
                  <option value={5}>5 cards</option>
                  <option value={10}>10 cards</option>
                  <option value={20}>20 cards</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button
                  onClick={onGenerateFlashcards}
                  disabled={generating}
                  style={{
                    flex: 1,
                    padding: '14px 20px',
                    background: generating 
                      ? '#d1d5db'
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: generating ? 'wait' : 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: generating ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.3)',
                  }}
                  onMouseEnter={(e) => {
                    if (!generating) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = generating ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.3)';
                  }}
                >
                  {generating ? '⏳ Generating...' : '✨ Generate'}
                </button>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  disabled={generating}
                  style={{ 
                    padding: '14px 20px',
                    borderRadius: 10,
                    border: '2px solid #e5e7eb',
                    background: 'white',
                    fontWeight: 600,
                    cursor: generating ? 'not-allowed' : 'pointer',
                    opacity: generating ? 0.5 : 1,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!generating) {
                      e.currentTarget.style.background = '#f3f4f6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Flashcards Modal - Enhanced */}
      {showReviewModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20,
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: 'white',
            padding: 32,
            borderRadius: 20,
            maxWidth: 800,
            width: '100%',
            maxHeight: '85vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <h3 style={{ 
              marginTop: 0,
              marginBottom: 8,
              fontSize: 24,
              fontWeight: 700,
            }}>
              🎴 Review Generated Flashcards
            </h3>
            <p style={{ 
              color: '#6b7280',
              fontSize: 14,
              marginBottom: 24,
            }}>
              Select which cards to add to your deck ({selectedCards.size} selected)
            </p>

            <div style={{ 
              marginBottom: 24,
              padding: 16,
              background: '#f9fafb',
              borderRadius: 12,
              border: '1px solid #e5e7eb',
            }}>
              {decks.length > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <label style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>
                    📚 Add to deck:
                  </label>
                  <select
                    value={deckIdForNewCard ?? ""}
                    onChange={(e) => setDeckIdForNewCard(e.target.value || null)}
                    style={{ 
                      padding: 10,
                      border: "2px solid #e5e7eb",
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 500,
                      flex: 1,
                    }}
                  >
                    {decks.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div style={{ 
                  color: '#dc2626',
                  fontSize: 14,
                  fontWeight: 500,
                  textAlign: 'center',
                }}>
                  ⚠️ No decks available. Create a deck first!
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gap: 16, marginBottom: 24 }}>
              {generatedCards.map((card, index) => (
                <div
                  key={index}
                  style={{
                    border: selectedCards.has(index) ? '2px solid #667eea' : '2px solid #e5e7eb',
                    borderRadius: 12,
                    padding: 16,
                    background: selectedCards.has(index) ? '#f5f7ff' : 'white',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                  }}
                  onClick={() => toggleCardSelection(index)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', gap: 16, alignItems: 'start' }}>
                    <input
                      type="checkbox"
                      checked={selectedCards.has(index)}
                      onChange={() => toggleCardSelection(index)}
                      style={{ marginTop: 4, width: 18, height: 18, cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>
                        {card.question}
                      </div>
                      {card.type === 'qa' ? (
                        <div style={{ 
                          color: '#6b7280',
                          fontSize: 14,
                          padding: 12,
                          background: '#f9fafb',
                          borderRadius: 8,
                        }}>
                          {card.answer}
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: 14, marginBottom: 8 }}>
                            {card.options.map((opt, i) => (
                              <div
                                key={i}
                                style={{
                                  padding: '8px 12px',
                                  marginBottom: 6,
                                  borderRadius: 8,
                                  background: i === card.correctIndex ? '#d1fae5' : '#f3f4f6',
                                  border: i === card.correctIndex ? '2px solid #10b981' : '2px solid #e5e7eb',
                                  fontWeight: i === card.correctIndex ? 600 : 400,
                                }}
                              >
                                {i + 1}. {opt}
                                {i === card.correctIndex && ' ✓'}
                              </div>
                            ))}
                          </div>
                          {card.explanation && (
                            <div style={{ 
                              fontSize: 13,
                              color: '#92400e',
                              fontStyle: 'italic',
                              padding: 12,
                              background: '#fffbeb',
                              borderRadius: 8,
                              borderLeft: '3px solid #f59e0b',
                            }}>
                              💡 {card.explanation}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={addSelectedCardsToDeck}
                disabled={selectedCards.size === 0 || !deckIdForNewCard || loading}
                style={{
                  flex: 1,
                  padding: '14px 20px',
                  background: selectedCards.size === 0 || !deckIdForNewCard || loading
                    ? '#d1d5db'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: selectedCards.size === 0 || loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: selectedCards.size === 0 || loading ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.3)',
                }}
                onMouseEnter={(e) => {
                  if (selectedCards.size > 0 && !loading && deckIdForNewCard) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = selectedCards.size === 0 || loading ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.3)';
                }}
              >
                {loading ? '⏳ Adding...' : `✓ Add ${selectedCards.size} cards to deck`}
              </button>
              <button
                onClick={() => setShowReviewModal(false)}
                disabled={loading}
                style={{ 
                  padding: '14px 20px',
                  borderRadius: 10,
                  border: '2px solid #e5e7eb',
                  background: 'white',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = '#f3f4f6';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Quiz Modal - Enhanced */}
      {showReviewQuizModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20,
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: 'white',
            padding: 32,
            borderRadius: 20,
            maxWidth: 800,
            width: '100%',
            maxHeight: '85vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <h3 style={{ 
              marginTop: 0,
              marginBottom: 8,
              fontSize: 24,
              fontWeight: 700,
            }}>
              📋 Review Generated Quiz
            </h3>
            <p style={{ 
              color: '#6b7280',
              fontSize: 14,
              marginBottom: 24,
            }}>
              Review the questions and save your quiz
            </p>
            
            <div style={{ 
              marginBottom: 20,
              padding: 16,
              background: '#f9fafb',
              borderRadius: 12,
              border: '1px solid #e5e7eb',
            }}>
              <label style={{ 
                display: 'block',
                marginBottom: 10,
                fontWeight: 600,
                fontSize: 14,
                color: '#374151',
              }}>
                Quiz Title:
              </label>
              <input
                type="text"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                placeholder="Enter quiz title..."
                style={{
                  width: '100%',
                  padding: 12,
                  border: '2px solid #e5e7eb',
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#667eea';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ 
              fontSize: 14,
              fontWeight: 600,
              color: '#6b7280',
              marginBottom: 20,
              padding: 12,
              background: '#f9fafb',
              borderRadius: 8,
            }}>
              📊 {generatedQuizQuestions.length} questions • ⭐ {generatedQuizQuestions.reduce((sum, q) => sum + (q.points || 1), 0)} points total
            </div>

            <div style={{ display: 'grid', gap: 16, marginBottom: 24 }}>
              {generatedQuizQuestions.map((question, index) => (
                <div
                  key={index}
                  style={{
                    border: '2px solid #e5e7eb',
                    borderRadius: 12,
                    padding: 16,
                    background: '#fafafa',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fafafa';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ 
                    fontWeight: 600,
                    marginBottom: 12,
                    fontSize: 15,
                    display: 'flex',
                    gap: 8,
                  }}>
                    <span style={{ 
                      color: '#667eea',
                      minWidth: 24,
                    }}>
                      {index + 1}.
                    </span>
                    <span>{question.question}</span>
                  </div>
                  
                  {question.type === 'mcq' && (
                    <div style={{ paddingLeft: 32 }}>
                      {question.options.map((opt, i) => (
                        <div
                          key={i}
                          style={{
                            padding: '8px 12px',
                            marginBottom: 6,
                            borderRadius: 8,
                            background: i === question.correctAnswer ? '#d1fae5' : 'white',
                            border: i === question.correctAnswer ? '2px solid #10b981' : '2px solid #e5e7eb',
                            fontWeight: i === question.correctAnswer ? 600 : 400,
                          }}
                        >
                          {opt} {i === question.correctAnswer && '✓'}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {question.type === 'true-false' && (
                    <div style={{ 
                      fontSize: 14,
                      color: '#10b981',
                      fontWeight: 600,
                      paddingLeft: 32,
                    }}>
                      ✓ Correct answer: {String(question.correctAnswer)}
                    </div>
                  )}
                  
                  {question.type === 'short-answer' && (
                    <div style={{ 
                      fontSize: 14,
                      color: '#6b7280',
                      paddingLeft: 32,
                      padding: 12,
                      background: 'white',
                      borderRadius: 8,
                      border: '1px solid #e5e7eb',
                    }}>
                      <strong>Expected answer:</strong> {String(question.correctAnswer)}
                    </div>
                  )}
                  
                  {question.explanation && (
                    <div style={{ 
                      fontSize: 13,
                      color: '#92400e',
                      fontStyle: 'italic',
                      marginTop: 12,
                      paddingLeft: 32,
                      padding: 12,
                      background: '#fffbeb',
                      borderRadius: 8,
                      borderLeft: '3px solid #f59e0b',
                    }}>
                      💡 {question.explanation}
                    </div>
                  )}
                  
                  <div style={{ 
                    fontSize: 12,
                    color: '#9ca3af',
                    marginTop: 12,
                    paddingLeft: 32,
                    fontWeight: 600,
                  }}>
                    Points: {question.points || 1}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={saveQuiz}
                disabled={!quizTitle.trim() || loading}
                style={{
                  flex: 1,
                  padding: '14px 20px',
                  background: !quizTitle.trim() || loading
                    ? '#d1d5db'
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: !quizTitle.trim() || loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: !quizTitle.trim() || loading ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)',
                }}
                onMouseEnter={(e) => {
                  if (quizTitle.trim() && !loading) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = !quizTitle.trim() || loading ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)';
                }}
              >
                {loading ? '⏳ Saving...' : '💾 Save Quiz'}
              </button>
              <button
                onClick={() => setShowReviewQuizModal(false)}
                disabled={loading}
                style={{ 
                  padding: '14px 20px',
                  borderRadius: 10,
                  border: '2px solid #e5e7eb',
                  background: 'white',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = '#f3f4f6';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}