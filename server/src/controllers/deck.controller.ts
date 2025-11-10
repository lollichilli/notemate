import { Response } from "express";
import { Types } from "mongoose";
import { Deck } from "../models/deck.model";
import { Flashcard } from "../models/flashcard.model";
import { AuthRequest } from "../middleware/auth";

export async function listDecks(req: AuthRequest, res: Response) {
  if (!req.auth?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const decks = await Deck.find({ ownerId: req.auth.id })
    .sort({ createdAt: -1 })
    .limit(50);
  
  res.json(decks);
}

export async function createDeck(req: AuthRequest, res: Response) {
  if (!req.auth?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { name } = req.body ?? {};
  if (!name) return res.status(400).json({ error: "name is required" });
  
  const deck = await Deck.create({ 
    name, 
    ownerId: new Types.ObjectId(req.auth.id),
    visibility: "private" 
  });
  
  res.status(201).json(deck);
}

export async function getDeckCards(req: AuthRequest, res: Response) {
  if (!req.auth?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "invalid id" });
  }

  const deck = await Deck.findOne({ _id: id, ownerId: req.auth.id });
  if (!deck) {
    return res.status(404).json({ error: "deck not found" });
  }

  const cards = await Flashcard.find({ deckId: id })
    .sort({ createdAt: -1 });
  
  res.json(cards);
}