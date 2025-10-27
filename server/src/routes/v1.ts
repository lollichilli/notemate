import { Router } from "express";
import multer from "multer";
import * as DocumentController from "../controllers/document.controller";
import * as DeckController from "../controllers/deck.controller";
import * as FlashController from "../controllers/flashcard.controller";
import * as QuizController from "../controllers/quiz.controller";
import * as Auth from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth";
import { generateFlashcardsFromDocument } from "../controllers/flashcard.controller";

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
router.post(
  "/documents/:documentId/generate-flashcards",
  authenticate,
  generateFlashcardsFromDocument
);

// Quizzes
router.post(
  "/documents/:documentId/generate-quiz",
  authenticate,
  QuizController.generateQuizFromDocument
);

router.post("/quizzes", authenticate, QuizController.createQuiz);
router.get("/quizzes", QuizController.listQuizzes);
router.get("/quizzes/:id", QuizController.getQuiz);
router.post("/quizzes/:id/attempt", authenticate, QuizController.submitQuizAttempt);
router.get("/quizzes/:id/attempts", QuizController.getQuizAttempts);
router.delete("/quizzes/:id", authenticate, QuizController.deleteQuiz);

// Auth
router.post("/auth/signup", Auth.register);
router.post("/auth/login", Auth.login);

export default router;