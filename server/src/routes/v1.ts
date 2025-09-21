import { Router } from "express";
import * as DocumentController from "../controllers/document.controller";


const router = Router();

// Documents
router.get("/documents", DocumentController.listDocuments);
router.post("/documents", DocumentController.createDocument);
router.post("/documents/:id/parse-md", DocumentController.parseMarkdownIntoBlocks);
router.get("/documents/:id/blocks", DocumentController.listBlocksByDocument);

export default router;
