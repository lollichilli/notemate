import { Request, Response } from "express";
import { Types } from "mongoose";
import { pdf } from "pdf-parse";
import { Document } from "../models/document.model";
import { DocBlock } from "../models/docblock.model";

type InsertBlock = {
  documentId: Types.ObjectId;
  page: number;
  blockIndex: number;
  type: "heading" | "paragraph" | "list";
  text: string;
};

function parseTextToBlocks(documentId: Types.ObjectId, raw: string): InsertBlock[] {
  const text = (raw || "").replace(/\r\n/g, "\n");
  const lines = text.split("\n");

  let blockIndex = 0;
  const blocks: InsertBlock[] = [];

  const pushBlock = (type: InsertBlock["type"] | "code", content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    const storeType: InsertBlock["type"] = type === "code" ? "paragraph" : type;
    blocks.push({ documentId, page: 1, blockIndex: blockIndex++, type: storeType, text: trimmed });
  };

  let inCode = false;
  let codeBuffer: string[] = [];
  let paraBuffer: string[] = [];
  let listBuffer: string[] = [];

  const flushParagraph = () => {
    if (paraBuffer.length) {
      pushBlock("paragraph", paraBuffer.join(" ").replace(/\s+/g, " "));
      paraBuffer = [];
    }
  };
  const flushList = () => {
    if (listBuffer.length) {
      pushBlock("list", listBuffer.join("\n"));
      listBuffer = [];
    }
  };
  const flushCode = () => {
    if (codeBuffer.length) {
      pushBlock("code", codeBuffer.join("\n"));
      codeBuffer = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine;
    if (/^```/.test(line.trim())) {
      if (inCode) { inCode = false; flushCode(); }
      else { inCode = true; flushParagraph(); flushList(); }
      continue;
    }
    if (inCode) { codeBuffer.push(line); continue; }

    const t = line.trim();
    if (!t) { flushList(); flushParagraph(); continue; }

    if (/^#{1,6}\s+/.test(t)) {
      flushList(); flushParagraph();
      pushBlock("heading", t.replace(/^#{1,6}\s+/, ""));
      continue;
    }

    if (/^[-*+]\s+/.test(t)) {
      flushParagraph();
      listBuffer.push(t.replace(/^[-*+]\s+/, ""));
      continue;
    }

    flushList();
    paraBuffer.push(t);
  }

  flushCode();
  flushList();
  flushParagraph();

  return blocks;
}

export async function listDocuments(_req: Request, res: Response) {
  const docs = await Document.find().sort({ createdAt: -1 }).limit(50);
  res.json(docs);
}

export async function createDocument(req: Request, res: Response) {
  const { title } = req.body ?? {};
  if (!title) return res.status(400).json({ error: "title is required" });

  const doc = await Document.create({
    title,
    uploaderId: null,
    source: {
      fileType: "md",
      originalName: `${title}.md`,
      sizeBytes: 0,
      storageKey: `inline/${Date.now()}`
    },
    parse: { status: "pending" },
    tags: []
  });

  res.status(201).json(doc);
}

export async function parseMarkdownIntoBlocks(req: Request, res: Response) {
  const { id } = req.params;
  const { markdown } = req.body ?? {};

  if (!Types.ObjectId.isValid(id)) return res.status(400).json({ error: "invalid id" });
  if (typeof markdown !== "string" || !markdown.trim()) {
    return res.status(400).json({ error: "markdown (string) is required" });
  }

  const doc = await Document.findById(id);
  if (!doc) return res.status(404).json({ error: "document not found" });

  const blocks = parseTextToBlocks(doc._id, markdown);

  await DocBlock.deleteMany({ documentId: doc._id });
  const result = blocks.length ? await DocBlock.insertMany(blocks) : [];

  doc.parse = { status: "done", pages: 1, engine: "markdown-basic", error: null };
  doc.source.sizeBytes = markdown.length;
  (doc.source as typeof doc.source & { rawText?: string }).rawText = markdown;
  await doc.save();

  res.json({ ok: true, blocksCreated: result.length });
}

export async function parsePdfIntoBlocks(req: Request, res: Response) {
  const { id } = req.params;

  if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "invalid id" });
  }

  const doc = await Document.findById(id);
  if (!doc) return res.status(404).json({ error: "document not found" });

  const file = (req as any).file as Express.Multer.File | undefined;
  if (!file) return res.status(400).json({ error: "file is required (field name 'file')" });

  const isPdf =
    file.mimetype === "application/pdf" ||
    (file.originalname && file.originalname.toLowerCase().endsWith(".pdf"));

  if (!isPdf) {
    return res.status(400).json({ error: "only PDF files are supported" });
  }

  try {
    const result = await pdf(new Uint8Array(file.buffer));
    const text = result?.text ?? "";

    const blocks = parseTextToBlocks(doc._id, text);
    await DocBlock.deleteMany({ documentId: doc._id });
    const inserted = blocks.length ? await DocBlock.insertMany(blocks) : [];

    doc.source.fileType = "pdf";
    doc.source.originalName = file.originalname || doc.source.originalName;
    doc.source.sizeBytes = file.size;
    (doc.source as typeof doc.source & { rawText?: string }).rawText = text;
    doc.parse = { status: "done", engine: "pdf-parse", error: null };
    await doc.save();

    res.json({
      ok: true,
      blocksCreated: inserted.length,
      textPreview: text.slice(0, 300),
      textLength: text.length,
    });
  } catch (e: any) {
    doc.parse = { status: "failed", engine: "pdf-parse", error: e?.message || "pdf parse failed" };
    await doc.save();
    console.error("pdf-parse error:", e);
    return res.status(500).json({ error: "pdf parse failed" });
  }
}

export async function getDocument(req: Request, res: Response) {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) return res.status(400).json({ error: "invalid id" });

  const doc = await Document.findById(id);
  if (!doc) return res.status(404).json({ error: "document not found" });

  res.json(doc);
}

export async function listBlocksByDocument(req: Request, res: Response) {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "invalid id" });
  }

  const blocks = await DocBlock.find({ documentId: id })
    .sort({ page: 1, blockIndex: 1 });

  res.json(blocks);
}