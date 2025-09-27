import { Schema, model, Types } from "mongoose";

export interface IFlashcard {
  _id: Types.ObjectId;
  deckId: Types.ObjectId;
  documentId?: Types.ObjectId | null;
  source?: { blockId?: Types.ObjectId | null; page?: number | null; quote?: string | null };

  type: "mcq" | "cloze" | "basic";
  prompt: string;
  answer: string;
  choices?: string[];

  difficulty?: 1 | 2 | 3;

  leitner: { box: number; nextReviewAt: Date };
  stats: { correct: number; incorrect: number };
  createdBy?: Types.ObjectId | null;
}

const FlashcardSchema = new Schema<IFlashcard>(
  {
    deckId: { type: Schema.Types.ObjectId, ref: "Deck", required: true, index: true },
    documentId: { type: Schema.Types.ObjectId, ref: "Document", default: null },
    source: {
      blockId: { type: Schema.Types.ObjectId, ref: "DocBlock", default: null },
      page: Number,
      quote: String
    },
    type: { type: String, enum: ["mcq", "cloze", "basic"], default: "basic" },
    prompt: { type: String, required: true },
    answer: { type: String, required: true },
    choices: { type: [String], default: [] },
    difficulty: { type: Number, enum: [1, 2, 3], default: 2 },
    leitner: {
      box: { type: Number, default: 1, index: true },
      nextReviewAt: { type: Date, default: () => new Date(), index: true }
    },
    stats: {
      correct: { type: Number, default: 0 },
      incorrect: { type: Number, default: 0 }
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null }
  },
  { timestamps: true }
);

FlashcardSchema.index({ deckId: 1, "leitner.nextReviewAt": 1 });

export const Flashcard = model<IFlashcard>("Flashcard", FlashcardSchema);
