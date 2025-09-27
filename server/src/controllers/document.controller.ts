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

  const text = markdown.replace(/\r\n/g, "\n");
  const lines = text.split("\n");

  let blockIndex = 0;
  const blocks = [] as Parameters<typeof DocBlock.insertMany>[0];

  const pushBlock = (type: "heading" | "paragraph" | "list" | "code", content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    // For now, we store code as paragraph text (you can add a "code" type later)
    const storeType = type === "code" ? "paragraph" : type;
    blocks.push({
      documentId: doc._id,
      page: 1,
      blockIndex: blockIndex++,
      type: storeType as "heading" | "paragraph" | "list",
      text: trimmed,
    });
  };

  let inCode = false;
  let codeBuffer: string[] = [];
  let paraBuffer: string[] = [];
  let listBuffer: string[] = [];

  const flushParagraph = () => {
    if (paraBuffer.length) {
      // Join paragraph lines with spaces, collapse extra whitespace
      pushBlock("paragraph", paraBuffer.join(" ").replace(/\s+/g, " "));
      paraBuffer = [];
    }
  };

  const flushList = () => {
    if (listBuffer.length) {
      // keep list items newline-separated within one block
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

  for (const raw of lines) {
    const line = raw;

    if (/^```/.test(line.trim())) {
      if (inCode) {
        // closing fence
        inCode = false;
        flushCode();
      } else {
        // opening fence (close any open paragraph/list first)
        inCode = true;
        flushParagraph();
        flushList();
      }
      continue;
    }

    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    const t = line.trim();

    // blank line -> break between blocks
    if (!t) {
      flushList();
      flushParagraph();
      continue;
    }

    // heading
    if (/^#{1,6}\s+/.test(t)) {
      flushList();
      flushParagraph();
      pushBlock("heading", t.replace(/^#{1,6}\s+/, ""));
      continue;
    }

    // list item
    if (/^[-*+]\s+/.test(t)) {
      // starting/continuing a list: ensure paragraph is closed
      flushParagraph();
      listBuffer.push(t.replace(/^[-*+]\s+/, ""));
      continue;
    }

    // normal text -> part of current paragraph
    // if we were in a list, close it first
    flushList();
    paraBuffer.push(t);
  }

  // flush any trailing buffers
  flushCode();
  flushList();
  flushParagraph();

  await DocBlock.deleteMany({ documentId: doc._id });
  const result = blocks.length ? await DocBlock.insertMany(blocks) : [];

  doc.parse = { status: "done", pages: 1, engine: "markdown-basic", error: null };
  doc.source.sizeBytes = markdown.length;
  doc.source.rawText = markdown;
  await doc.save();


  res.json({ ok: true, blocksCreated: result.length });
}

export async function listBlocksByDocument(req: Request, res: Response) {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) return res.status(400).json({ error: "invalid id" });

  const blocks = await DocBlock.find({ documentId: id }).sort({ page: 1, blockIndex: 1 });
  res.json(blocks);
}

export async function getDocument(req: Request, res: Response) {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) return res.status(400).json({ error: "invalid id" });
  const doc = await Document.findById(id);
  if (!doc) return res.status(404).json({ error: "document not found" });
  res.json(doc);
}
