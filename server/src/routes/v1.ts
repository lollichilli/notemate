import { Router } from "express";
import multer from "multer";
import * as DocumentController from "../controllers/document.controller";
import * as DeckController from "../controllers/deck.controller";
import * as FlashController from "../controllers/flashcard.controller";
import * as Auth from "../controllers/auth.controller";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

// Documents
router.get("/documents", DocumentController.listDocuments);
router.post("/documents", DocumentController.createDocument);
router.get("/documents/:id", DocumentController.getDocument);
router.post("/documents/:id/parse-md", DocumentController.parseMarkdownIntoBlocks);
router.post("/documents/:id/parse-pdf", upload.single("file"), DocumentController.parsePdfIntoBlocks);
router.get("/documents/:id/blocks", DocumentController.listBlocksByDocument);

// Decks
router.get("/decks", DeckController.listDecks);
router.post("/decks", DeckController.createDeck);
router.get("/decks/:id/cards", DeckController.getDeckCards);

// Flashcards
router.post("/decks/:id/cards", FlashController.createCard);
router.get("/decks/:id/due", FlashController.listDue);
router.post("/cards/:id/review", FlashController.reviewCard);

router.post("/auth/signup", Auth.register);
router.post("/auth/login", Auth.login);

export default router;