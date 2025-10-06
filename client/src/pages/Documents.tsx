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

export default function Documents() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<DocBlock[]>([]);
  const [title, setTitle] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [decks, setDecks] = useState<Deck[]>([]);
  const [deckIdForNewCard, setDeckIdForNewCard] = useState<string | null>(null);

  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [cardPrompt, setCardPrompt] = useState("");
  const [cardAnswer, setCardAnswer] = useState("");

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfName, setPdfName] = useState<string>("");
  const [pdfStatus, setPdfStatus] = useState<string>("");

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

  async function handleFileUpload(file: File) {
    if (!selectedId) {
      setError("Select or create a document first");
      return;
    }
    try {
      setError(null);
      setLoading(true);

      const isPdf =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");

      if (isPdf) {
        await uploadPdfAndParse(selectedId, file);
        const [doc, b] = await Promise.all([
          getDocument(selectedId),
          listBlocks(selectedId),
        ]);
        setBlocks(b);
        const raw = (doc as any)?.source?.rawText as string | undefined;
        setMarkdown(raw && raw.trim().length ? raw : "");
      } else {
        const text = await readFileAsText(file);
        setMarkdown(text);
        await parseMarkdown(selectedId, text);
        const b = await listBlocks(selectedId);
        setBlocks(b);
      }
    } catch (err: any) {
      setError(err?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      style={{
        padding: 16,
        display: "grid",
        gridTemplateColumns: "280px 1fr",
        gap: 16,
      }}
    >
      {/* Left column: create + list */}
      <aside style={{ borderRight: "1px solid #eee", paddingRight: 12 }}>
        <h2 style={{ marginTop: 0 }}>Documents</h2>

        <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
          <input
            placeholder="New document title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6 }}
          />
          <button
            onClick={onCreate}
            style={{ padding: "8px 10px", borderRadius: 6 }}
          >
            Create
          </button>
        </div>

        <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
          {docs.length ? "Your documents:" : "No documents yet."}
        </div>
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "grid",
            gap: 6,
          }}
        >
          {docs.map((d) => (
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
                <div style={{ fontWeight: 600 }}>{d.title}</div>
                <div style={{ fontSize: 12, color: "#666" }}>
                  {new Date(d.createdAt).toLocaleString()}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Right column: editor + blocks */}
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

        <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h3 style={{ margin: 0, flex: 1 }}>
              {selectedDoc ? selectedDoc.title : "No document selected"}
            </h3>
            {loading && <span style={{ fontSize: 12, color: "#666" }}>Loading…</span>}
          </div>

          {/* File picker */}
          <div style={{ display: "grid", gap: 8 }}>
            <input
              type="file"
              accept=".md,.markdown,.txt,.pdf"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.currentTarget.value = "";
                if (!f) return;
                onPickFile(f);
              }}
            />

            {/* parse button */}
            {pdfFile ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#666" }}>
                  Selected PDF: <strong>{pdfName}</strong>
                </span>
                <button
                  onClick={onParsePdf}
                  disabled={!selectedId || !pdfFile || loading}
                  style={{ padding: "6px 10px", borderRadius: 6 }}
                >
                  Parse PDF → Blocks
                </button>
                {pdfStatus && (
                  <span style={{ fontSize: 12, color: "#666" }}>{pdfStatus}</span>
                )}
              </div>
            ) : (
              <span style={{ fontSize: 12, color: "#666" }}>
                Tip: Pick a PDF, then click “Parse PDF → Blocks”
              </span>
            )}
          </div>


          {/* Markdown textarea */}
          <textarea
            placeholder="# Paste Markdown here\n- bullet\n- bullet"
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            rows={10}
            style={{
              width: "100%",
              padding: 10,
              border: "1px solid #ddd",
              borderRadius: 6,
              fontFamily: "ui-monospace, monospace",
            }}
          />

          <div>
            <button
              onClick={onParse}
              disabled={!selectedId || !markdown.trim()}
              style={{ padding: "8px 10px", borderRadius: 6 }}
            >
              Parse Markdown → Blocks
            </button>
          </div>
        </div>

        {/* Deck picker for “add as flashcard” */}
        {decks.length > 0 ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <label style={{ fontSize: 12, color: "#666" }}>
              Add cards to deck:
            </label>
            <select
              value={deckIdForNewCard ?? ""}
              onChange={(e) => setDeckIdForNewCard(e.target.value || null)}
              style={{ padding: 6, border: "1px solid #ddd", borderRadius: 6 }}
            >
              {decks.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
            No decks yet — create one on the Decks page first.
          </div>
        )}

        <h4>Parsed Blocks</h4>
        {!blocks.length ? (
          <div style={{ fontSize: 14, color: "#666" }}>
            No blocks yet. Parse some Markdown above or upload a PDF.
          </div>
        ) : (
          <ol style={{ paddingLeft: 18, display: "grid", gap: 8 }}>
            {blocks.map((b) => (
              <li
                key={b._id}
                style={{ border: "1px solid #eee", padding: 10, borderRadius: 6 }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: 12,
                        padding: "2px 6px",
                        borderRadius: 12,
                        border: "1px solid #ddd",
                        marginRight: 8,
                        background: "#fafafa",
                      }}
                    >
                      {b.type}
                    </span>
                    <span>{b.text}</span>
                  </div>

                  <div>
                    <button
                      onClick={() => startAddCardFromBlock(b)}
                      style={{ padding: "6px 8px", borderRadius: 6 }}
                      disabled={!decks.length}
                    >
                      Add as flashcard
                    </button>
                  </div>
                </div>

                {editingBlockId === b._id && (
                  <div
                    style={{
                      marginTop: 10,
                      borderTop: "1px dashed #ddd",
                      paddingTop: 10,
                    }}
                  >
                    <div style={{ display: "grid", gap: 8 }}>
                      <input
                        value={cardPrompt}
                        onChange={(e) => setCardPrompt(e.target.value)}
                        placeholder="Prompt"
                        style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6 }}
                      />
                      <input
                        value={cardAnswer}
                        onChange={(e) => setCardAnswer(e.target.value)}
                        placeholder="Answer"
                        style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6 }}
                      />

                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => saveCardFromBlock(b)}
                          style={{ padding: "8px 10px", borderRadius: 6 }}
                          disabled={
                            !deckIdForNewCard ||
                            !cardPrompt.trim() ||
                            !cardAnswer.trim()
                          }
                        >
                          Save card to deck
                        </button>
                        <button
                          onClick={cancelAddCard}
                          style={{ padding: "8px 10px", borderRadius: 6 }}
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
    </section>
  );
}
