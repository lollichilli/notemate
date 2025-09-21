import { Request, Response } from "express";
import { Types } from "mongoose";
import { Document } from "../models/document.model";
import { DocBlock } from "../models/docblock.model";

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
  if (typeof markdown !== "string" || !markdown.trim())
    return res.status(400).json({ error: "markdown (string) is required" });

  const doc = await Document.findById(id);
  if (!doc) return res.status(404).json({ error: "document not found" });

  // Simple MD → blocks
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let blockIndex = 0;
  const blocks = [] as Parameters<typeof DocBlock.insertMany>[0];

  const pushBlock = (type: "heading" | "paragraph" | "list", text: string) => {
    if (!text.trim()) return;
    blocks.push({
      documentId: doc._id,
      page: 1,
      blockIndex: blockIndex++,
      type,
      text: text.trim()
    });
  };

  let listBuffer: string[] = [];
  const flushList = () => {
    if (listBuffer.length) {
      pushBlock("list", listBuffer.join("\n"));
      listBuffer = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushList();
      continue;
    }
    if (/^#{1,6}\s+/.test(line)) {
      flushList();
      pushBlock("heading", line.replace(/^#{1,6}\s+/, ""));
    } else if (/^[-*]\s+/.test(line)) {
      listBuffer.push(line.replace(/^[-*]\s+/, ""));
    } else {
      flushList();
      pushBlock("paragraph", line);
    }
  }
  flushList();

  // Replace existing blocks for this doc
  await DocBlock.deleteMany({ documentId: doc._id });
  const result = blocks.length ? await DocBlock.insertMany(blocks) : [];

  // Update parse status
  doc.parse = { status: "done", pages: 1, engine: "markdown-basic", error: null };
  doc.source.sizeBytes = markdown.length;
  await doc.save();

  res.json({ ok: true, blocksCreated: result.length });
}

export async function listBlocksByDocument(req: Request, res: Response) {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) return res.status(400).json({ error: "invalid id" });

  const blocks = await DocBlock.find({ documentId: id }).sort({ page: 1, blockIndex: 1 });
  res.json(blocks);
}
