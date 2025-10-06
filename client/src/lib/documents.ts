import { API_URL } from "./api";

export type Doc = {
  _id: string;
  title: string;
  createdAt: string;
  parse?: { status: "pending" | "done" | "failed" };
};

export type DocBlock = {
  _id: string;
  documentId: string;
  page: number;
  blockIndex: number;
  type: "heading" | "paragraph" | "list";
  text: string;
};

export async function listDocuments(): Promise<Doc[]> {
  const r = await fetch(`${API_URL}/api/v1/documents`);
  if (!r.ok) throw new Error("Failed to list documents");
  return r.json();
}

export async function createDocument(title: string): Promise<Doc> {
  const r = await fetch(`${API_URL}/api/v1/documents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!r.ok) throw new Error("Failed to create document");
  return r.json();
}

export async function parseMarkdown(docId: string, markdown: string) {
  const r = await fetch(`${API_URL}/api/v1/documents/${docId}/parse-md`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ markdown }),
  });
  if (!r.ok) throw new Error("Failed to parse markdown");
  return r.json();
}

export async function listBlocks(docId: string): Promise<DocBlock[]> {
  const r = await fetch(`${API_URL}/api/v1/documents/${docId}/blocks`);
  if (!r.ok) throw new Error("Failed to list blocks");
  return r.json();
}

export async function getDocument(id: string): Promise<Doc & { source?: any }> {
  const r = await fetch(`${API_URL}/api/v1/documents/${id}`);
  if (!r.ok) throw new Error("Failed to get document");
  return r.json();
}

export async function uploadPdfAndParse(documentId: string, file: File) {
  const fd = new FormData();
  fd.append("file", file);

  const url = `${API_URL}/api/v1/documents/${encodeURIComponent(
    documentId
  )}/parse-pdf`;

  let r: Response;
  try {
    r = await fetch(url, {
      method: "POST",
      body: fd,
    });
  } catch (netErr: any) {
    throw new Error(`Network error hitting ${url}: ${netErr?.message ?? netErr}`);
  }

  if (!r.ok) {
    const text = await r.text();
    throw new Error(
      `HTTP ${r.status} ${r.statusText} from ${url} — ${text.slice(0, 500)}`
    );
  }
  return r.json();
}

