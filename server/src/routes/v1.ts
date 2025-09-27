import { Router } from "express";
import * as DocumentController from "../controllers/document.controller";
import * as DeckController from "../controllers/deck.controller";
import * as FlashController from "../controllers/flashcard.controller";

const router = Router();

// Documents
router.get("/documents", DocumentController.listDocuments);
router.post("/documents", DocumentController.createDocument);
router.get("/documents/:id", DocumentController.getDocument);
router.post("/documents/:id/parse-md", DocumentController.parseMarkdownIntoBlocks);
router.get("/documents/:id/blocks", DocumentController.listBlocksByDocument);

// Decks
router.get("/decks", DeckController.listDecks);
router.post("/decks", DeckController.createDeck);
router.get("/decks/:id/cards", DeckController.getDeckCards);

// Flashcards
router.post("/decks/:id/cards", FlashController.createCard);
router.get("/decks/:id/due", FlashController.listDue);
router.post("/cards/:id/review", FlashController.reviewCard);

export default router;
