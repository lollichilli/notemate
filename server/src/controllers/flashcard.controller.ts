import { Response } from "express";
import { Types } from "mongoose";
import { Flashcard } from "../models/flashcard.model";
import { DocBlock } from "../models/docblock.model";
import { Deck } from "../models/deck.model";
import { Document } from '../models/document.model';
import { generateFlashcards } from '../services/openai.service';
import { AuthRequest } from "../middleware/auth";

function nextReviewFromBox(box: number): Date {
  // Leitner schedule: 1,2,4,8,16 days
  const days = Math.pow(2, Math.max(0, box - 1));
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

// ✅ Verify deck ownership before creating card
export async function createCard(req: AuthRequest, res: Response) {
  if (!req.auth?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id: deckId } = req.params;
  const { type = "basic", prompt, answer, blockId } = req.body ?? {};

  if (!Types.ObjectId.isValid(deckId)) {
    return res.status(400).json({ error: "invalid deck id" });
  }
  
  if (!prompt || !answer) {
    return res.status(400).json({ error: "prompt and answer are required" });
  }

  // ✅ Verify deck ownership
  const deck = await Deck.findOne({ _id: deckId, ownerId: req.auth.id });
  if (!deck) {
    return res.status(404).json({ error: "deck not found" });
  }

  let source:
    | { blockId?: Types.ObjectId | null; page?: number | null; quote?: string | null }
    | undefined = undefined;
  let documentId: Types.ObjectId | undefined;

  if (blockId) {
    if (!Types.ObjectId.isValid(blockId)) {
      return res.status(400).json({ error: "invalid block id" });
    }
    
    const block = await DocBlock.findById(blockId);
    if (!block) {
      return res.status(404).json({ error: "block not found" });
    }

    // ✅ Verify document ownership
    const doc = await Document.findOne({ 
      _id: block.documentId, 
      uploaderId: req.auth.id 
    });
    if (!doc) {
      return res.status(404).json({ error: "document not found" });
    }

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

// ✅ Verify deck ownership before listing due cards
export async function listDue(req: AuthRequest, res: Response) {
  if (!req.auth?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id: deckId } = req.params;
  if (!Types.ObjectId.isValid(deckId)) {
    return res.status(400).json({ error: "invalid deck id" });
  }

  // ✅ Verify deck ownership
  const deck = await Deck.findOne({ _id: deckId, ownerId: req.auth.id });
  if (!deck) {
    return res.status(404).json({ error: "deck not found" });
  }

  const now = new Date();
  const cards = await Flashcard.find({
    deckId,
    "leitner.nextReviewAt": { $lte: now }
  }).sort({ "leitner.nextReviewAt": 1 }).limit(100);

  res.json(cards);
}

// ✅ Verify card ownership (through deck) before reviewing
export async function reviewCard(req: AuthRequest, res: Response) {
  if (!req.auth?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id } = req.params;
  const { result } = req.body ?? {};
  
  if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "invalid card id" });
  }
  
  if (!["again", "gotit"].includes(result)) {
    return res.status(400).json({ error: "result must be 'again' or 'gotit'" });
  }

  const card = await Flashcard.findById(id);
  if (!card) {
    return res.status(404).json({ error: "card not found" });
  }

  // ✅ Verify deck ownership
  const deck = await Deck.findOne({ _id: card.deckId, ownerId: req.auth.id });
  if (!deck) {
    return res.status(404).json({ error: "deck not found" });
  }

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

// ✅ Verify document ownership before generating flashcards
export async function generateFlashcardsFromDocument(
  req: AuthRequest,
  res: Response
) {
  try {
    if (!req.auth?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { documentId } = req.params;
    const { type, count } = req.body;

    // Validate
    if (!type || !['qa', 'mc'].includes(type)) {
      return res.status(400).json({ message: 'Invalid type. Must be "qa" or "mc"' });
    }

    if (!count || ![5, 10, 20].includes(Number(count))) {
      return res.status(400).json({ message: 'Invalid count. Must be 5, 10, or 20' });
    }

    if (!Types.ObjectId.isValid(documentId)) {
      return res.status(400).json({ message: 'Invalid document ID' });
    }

    // ✅ Verify document ownership
    const doc = await Document.findOne({ 
      _id: documentId, 
      uploaderId: req.auth.id 
    });
    
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Get blocks for the document
    const blocks = await DocBlock.find({ documentId }).sort({ page: 1, blockIndex: 1 });
    
    if (!blocks.length) {
      return res.status(400).json({ 
        message: 'Document has no content blocks' 
      });
    }

    const content = blocks.map(b => b.text).join('\n\n');

    if (!content || content.trim().length < 50) {
      return res.status(400).json({ 
        message: 'Document content too short to generate flashcards' 
      });
    }

    // Generate flashcards with OpenAI
    const flashcards = await generateFlashcards({
      content,
      type,
      count: Number(count),
    });

    res.json({ flashcards, documentId });
  } catch (error: any) {
    console.error('Generate flashcards error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to generate flashcards' 
    });
  }
}