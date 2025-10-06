import { Types } from "mongoose";

export type InsertBlock = {
  documentId: Types.ObjectId;
  page: number;
  blockIndex: number;
  type: "heading" | "paragraph" | "list";
  text: string;
};

export function parseTextToBlocks(documentId: Types.ObjectId, text: string) {
  const normalized = text.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");

  let blockIndex = 0;
  const blocks: InsertBlock[] = [];

  const pushBlock = (type: InsertBlock["type"] | "code", content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    const storeType: InsertBlock["type"] = type === "code" ? "paragraph" : type;
    blocks.push({
      documentId,
      page: 1,
      blockIndex: blockIndex++,
      type: storeType,
      text: trimmed,
    });
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

  for (const raw of lines) {
    const line = raw;

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
