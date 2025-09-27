import { Request, Response } from "express";
import { Types } from "mongoose";
import { Deck } from "../models/deck.model";
import { Flashcard } from "../models/flashcard.model";

export async function listDecks(_req: Request, res: Response) {
  const decks = await Deck.find().sort({ createdAt: -1 }).limit(50);
  res.json(decks);
}

export async function createDeck(req: Request, res: Response) {
  const { name } = req.body ?? {};
  if (!name) return res.status(400).json({ error: "name is required" });
  const deck = await Deck.create({ name, visibility: "private" });
  res.status(201).json(deck);
}

export async function getDeckCards(req: Request, res: Response) {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) return res.status(400).json({ error: "invalid id" });
  const cards = await Flashcard.find({ deckId: id }).sort({ createdAt: -1 });
  res.json(cards);
}
