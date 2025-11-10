import { Router } from "express";
import multer from "multer";
import * as DocumentController from "../controllers/document.controller";
import * as DeckController from "../controllers/deck.controller";
import * as FlashController from "../controllers/flashcard.controller";
import * as QuizController from "../controllers/quiz.controller";
import * as Auth from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

// Auth (public routes)
router.post("/auth/signup", Auth.register);
router.post("/auth/login", Auth.login);

// ✅ Documents (all protected)
router.get("/documents", authenticate, DocumentController.listDocuments);
router.post("/documents", authenticate, DocumentController.createDocument);
router.get("/documents/:id", authenticate, DocumentController.getDocument);
router.post("/documents/:id/parse-md", authenticate, DocumentController.parseMarkdownIntoBlocks);
router.post("/documents/:id/parse-pdf", authenticate, upload.single("file"), DocumentController.parsePdfIntoBlocks);
router.get("/documents/:id/blocks", authenticate, DocumentController.listBlocksByDocument);

// ✅ Decks (all protected)
router.get("/decks", authenticate, DeckController.listDecks);
router.post("/decks", authenticate, DeckController.createDeck);
router.get("/decks/:id/cards", authenticate, DeckController.getDeckCards);

// ✅ Flashcards (all protected)
router.post("/decks/:id/cards", authenticate, FlashController.createCard);
router.get("/decks/:id/due", authenticate, FlashController.listDue);
router.post("/cards/:id/review", authenticate, FlashController.reviewCard);
router.post("/documents/:documentId/generate-flashcards", authenticate, FlashController.generateFlashcardsFromDocument);

// ✅ Quizzes (all protected)
router.post("/documents/:documentId/generate-quiz", authenticate, QuizController.generateQuizFromDocument);
router.post("/quizzes", authenticate, QuizController.createQuiz);
router.get("/quizzes", authenticate, QuizController.listQuizzes);
router.get("/quizzes/:id", authenticate, QuizController.getQuiz);
router.post("/quizzes/:id/attempt", authenticate, QuizController.submitQuizAttempt);
router.get("/quizzes/:id/attempts", authenticate, QuizController.getQuizAttempts);
router.delete("/quizzes/:id", authenticate, QuizController.deleteQuiz);

export default router;