import { API_URL } from "./api";

export type Deck = {
  _id: string;
  name: string;
  createdAt: string;
};

export type Card = {
  _id: string;
  deckId: string;
  type: "basic" | "mcq" | "cloze";
  prompt: string;
  answer: string;
  leitner: { box: number; nextReviewAt: string };
  stats: { correct: number; incorrect: number };
  createdAt: string;
};

export async function listDecks(): Promise<Deck[]> {
  const r = await fetch(`${API_URL}/api/v1/decks`);
  if (!r.ok) throw new Error("Failed to list decks");
  return r.json();
}

export async function createDeck(name: string): Promise<Deck> {
  const r = await fetch(`${API_URL}/api/v1/decks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!r.ok) throw new Error("Failed to create deck");
  return r.json();
}

export async function listCards(deckId: string): Promise<Card[]> {
  const r = await fetch(`${API_URL}/api/v1/decks/${deckId}/cards`);
  if (!r.ok) throw new Error("Failed to list cards");
  return r.json();
}

export async function listDue(deckId: string): Promise<Card[]> {
  const r = await fetch(`${API_URL}/api/v1/decks/${deckId}/due`);
  if (!r.ok) throw new Error("Failed to fetch due cards");
  return r.json();
}

export async function reviewCard(cardId: string, result: "again" | "gotit") {
  const r = await fetch(`${API_URL}/api/v1/cards/${cardId}/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ result }),
  });
  if (!r.ok) throw new Error("Failed to review card");
  return r.json();
}

export async function createCard(
    deckId: string,
    payload: { type?: "basic" | "mcq" | "cloze"; prompt: string; answer: string; blockId?: string }
  ) {
    const r = await fetch(`${API_URL}/api/v1/decks/${deckId}/cards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error("Failed to create card");
    return r.json();
  }
  