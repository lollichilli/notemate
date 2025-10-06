import { Request, Response } from "express";
import { Types } from "mongoose";
import { Flashcard } from "../models/flashcard.model";
import { DocBlock } from "../models/docblock.model";

function nextReviewFromBox(box: number): Date {
  // Leitner schedule: 1,2,4,8,16 days
  const days = Math.pow(2, Math.max(0, box - 1));
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

export async function createCard(req: Request, res: Response) {
  const { id: deckId } = req.params;
  const { type = "basic", prompt, answer, blockId } = req.body ?? {};

  if (!Types.ObjectId.isValid(deckId)) return res.status(400).json({ error: "invalid deck id" });
  if (!prompt || !answer) return res.status(400).json({ error: "prompt and answer are required" });

  let source:
    | { blockId?: Types.ObjectId | null; page?: number | null; quote?: string | null }
    | undefined = undefined;
  let documentId: Types.ObjectId | undefined;

  if (blockId) {
    if (!Types.ObjectId.isValid(blockId)) return res.status(400).json({ error: "invalid block id" });
    const block = await DocBlock.findById(blockId);
    if (!block) return res.status(404).json({ error: "block not found" });
    source = { blockId: block._id, page: block.page, quote: block.text };
    documentId = block.documentId as unknown as Types.ObjectId;
  }

  const card = await Flashcard.create({
    deckId,
    documentId: documentId ?? null,
    source,
    type,
    prompt,
    answer,
    leitner: { box: 1, nextReviewAt: new Date() },
    stats: { correct: 0, incorrect: 0 }
  });

  res.status(201).json(card);
}

export async function listDue(req: Request, res: Response) {
  const { id: deckId } = req.params;
  if (!Types.ObjectId.isValid(deckId)) return res.status(400).json({ error: "invalid deck id" });

  const now = new Date();
  const cards = await Flashcard.find({
    deckId,
    "leitner.nextReviewAt": { $lte: now }
  }).sort({ "leitner.nextReviewAt": 1 }).limit(100);

  res.json(cards);
}

export async function reviewCard(req: Request, res: Response) {
  const { id } = req.params;
  const { result } = req.body ?? {};
  if (!Types.ObjectId.isValid(id)) return res.status(400).json({ error: "invalid card id" });
  if (!["again", "gotit"].includes(result)) return res.status(400).json({ error: "result must be 'again' or 'gotit'" });

  const card = await Flashcard.findById(id);
  if (!card) return res.status(404).json({ error: "card not found" });

  if (result === "again") {
    card.leitner.box = 1;
    card.stats.incorrect += 1;
  } else {
    card.leitner.box = Math.min(5, (card.leitner.box ?? 1) + 1);
    card.stats.correct += 1;
  }
  card.leitner.nextReviewAt = nextReviewFromBox(card.leitner.box);
  await card.save();

  res.json({ ok: true, card });
}
