import { Response } from "express";
import { Types } from "mongoose";
import { quiz } from "../models/quiz.model";
import { quizAttempt } from "../models/quizattempt.model";
import { Document } from "../models/document.model";
import { DocBlock } from "../models/docblock.model";
import { generateQuiz } from "../services/openai.service";
import { AuthRequest } from "../middleware/auth";

export async function generateQuizFromDocument(
  req: AuthRequest,
  res: Response
) {
  try {
    if (!req.auth?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { documentId } = req.params;
    const { type, count } = req.body;

    if (!type || !['mcq', 'true-false', 'mixed'].includes(type)) {
      return res.status(400).json({ message: 'Invalid type. Must be "mcq", "true-false", or "mixed"' });
    }

    if (!count || ![5, 10, 15, 20].includes(Number(count))) {
      return res.status(400).json({ message: 'Invalid count. Must be 5, 10, 15, or 20' });
    }

    if (!Types.ObjectId.isValid(documentId)) {
      return res.status(400).json({ message: 'Invalid document ID' });
    }

    const doc = await Document.findOne({ _id: documentId, uploaderId: req.auth.id });
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const blocks = await DocBlock.find({ documentId }).sort({ page: 1, blockIndex: 1 });
    
    if (!blocks.length) {
      return res.status(400).json({ message: 'Document has no content blocks' });
    }

    const content = blocks.map(b => b.text).join('\n\n');

    if (content.trim().length < 100) {
      return res.status(400).json({ 
        message: 'Document content too short to generate quiz (minimum 100 characters)' 
      });
    }

    const questions = await generateQuiz({
      content,
      type,
      count: Number(count),
    });

    res.json({ questions, documentId });
  } catch (error: any) {
    console.error('Generate quiz error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to generate quiz' 
    });
  }
}

export async function createQuiz(req: AuthRequest, res: Response) {
  try {
    if (!req.auth?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { title, documentId, questions, timeLimit, tags } = req.body;

    if (!title || !documentId || !questions || !Array.isArray(questions)) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!Types.ObjectId.isValid(documentId)) {
      return res.status(400).json({ message: 'Invalid document ID' });
    }

    const doc = await Document.findOne({ _id: documentId, uploaderId: req.auth.id });
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);

    const newQuiz = await quiz.create({
      title,
      documentId,
      createdBy: new Types.ObjectId(req.auth.id),
      questions,
      totalPoints,
      timeLimit: timeLimit || null,
      tags: tags || []
    });

    res.status(201).json(newQuiz);
  } catch (error: any) {
    console.error('Create quiz error:', error);
    res.status(500).json({ message: 'Failed to create quiz' });
  }
}

export async function listQuizzes(req: AuthRequest, res: Response) {
  try {
    if (!req.auth?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { documentId } = req.query;

    const filter: any = { createdBy: req.auth.id };
    
    if (documentId && Types.ObjectId.isValid(documentId as string)) {
      filter.documentId = documentId;
    }

    const quizzes = await quiz.find(filter)
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(quizzes);
  } catch (error: any) {
    console.error('List quizzes error:', error);
    res.status(500).json({ message: 'Failed to list quizzes' });
  }
}

export async function getQuiz(req: AuthRequest, res: Response) {
  try {
    if (!req.auth?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid quiz ID' });
    }

    const foundQuiz = await quiz.findOne({ _id: id, createdBy: req.auth.id });
    if (!foundQuiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    res.json(foundQuiz);
  } catch (error: any) {
    console.error('Get quiz error:', error);
    res.status(500).json({ message: 'Failed to get quiz' });
  }
}

export async function submitQuizAttempt(req: AuthRequest, res: Response) {
  try {
    if (!req.auth?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id: quizId } = req.params;
    const { answers, timeSpent } = req.body;

    if (!Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ message: 'Invalid quiz ID' });
    }

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'Answers array is required' });
    }

    const foundQuiz = await quiz.findOne({ _id: quizId, createdBy: req.auth.id });
    if (!foundQuiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    let score = 0;
    const gradedAnswers = answers.map((answer) => {
      const question = foundQuiz.questions[answer.questionIndex];
      if (!question) {
        return {
          questionIndex: answer.questionIndex,
          userAnswer: answer.userAnswer,
          isCorrect: false,
          pointsEarned: 0
        };
      }

      let isCorrect = false;
      
      if (question.type === 'mcq') {
        isCorrect = Number(answer.userAnswer) === Number(question.correctAnswer);
      } else if (question.type === 'true-false') {
        isCorrect = String(answer.userAnswer).toLowerCase() === String(question.correctAnswer).toLowerCase();
      } else if (question.type === 'short-answer') {
        const userAns = String(answer.userAnswer).toLowerCase().trim();
        const correctAns = String(question.correctAnswer).toLowerCase().trim();
        isCorrect = userAns === correctAns;
      }

      const pointsEarned = isCorrect ? (question.points || 1) : 0;
      score += pointsEarned;

      return {
        questionIndex: answer.questionIndex,
        userAnswer: answer.userAnswer,
        isCorrect,
        pointsEarned
      };
    });

    const percentage = foundQuiz.totalPoints > 0 ? (score / foundQuiz.totalPoints) * 100 : 0;

    const newAttempt = await quizAttempt.create({
      quizId,
      userId: new Types.ObjectId(req.auth.id),
      answers: gradedAnswers,
      score,
      totalPoints: foundQuiz.totalPoints,
      percentage: Math.round(percentage * 100) / 100,
      timeSpent: timeSpent || null,
      completedAt: new Date()
    });

    res.status(201).json(newAttempt);
  } catch (error: any) {
    console.error('Submit quiz attempt error:', error);
    res.status(500).json({ message: 'Failed to submit quiz attempt' });
  }
}

export async function getQuizAttempts(req: AuthRequest, res: Response) {
  try {
    if (!req.auth?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id: quizId } = req.params;

    if (!Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ message: 'Invalid quiz ID' });
    }

    const foundQuiz = await quiz.findOne({ _id: quizId, createdBy: req.auth.id });
    if (!foundQuiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const attempts = await quizAttempt.find({ quizId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(attempts);
  } catch (error: any) {
    console.error('Get quiz attempts error:', error);
    res.status(500).json({ message: 'Failed to get quiz attempts' });
  }
}

export async function deleteQuiz(req: AuthRequest, res: Response) {
  try {
    if (!req.auth?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid quiz ID' });
    }

    const deletedQuiz = await quiz.findOneAndDelete({ 
      _id: id, 
      createdBy: req.auth.id 
    });
    
    if (!deletedQuiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    await quizAttempt.deleteMany({ quizId: id });

    res.json({ message: 'Quiz deleted successfully' });
  } catch (error: any) {
    console.error('Delete quiz error:', error);
    res.status(500).json({ message: 'Failed to delete quiz' });
  }
}