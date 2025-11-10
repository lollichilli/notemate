import { API_URL } from "./api";

export type QuizQuestionType = "mcq" | "true-false" | "short-answer";

export interface QuizQuestionMCQ {
  type: "mcq";
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  points?: number;
}

export interface QuizQuestionTrueFalse {
  type: "true-false";
  question: string;
  correctAnswer: "true" | "false";
  explanation?: string;
  points?: number;
}

export interface QuizQuestionShortAnswer {
  type: "short-answer";
  question: string;
  correctAnswer: string;
  explanation?: string;
  points?: number;
}

export type QuizQuestion = QuizQuestionMCQ | QuizQuestionTrueFalse | QuizQuestionShortAnswer;

export interface Quiz {
  _id: string;
  title: string;
  documentId: string;
  questions: QuizQuestion[];
  totalPoints: number;
  timeLimit?: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface QuizAnswer {
  questionIndex: number;
  userAnswer: string | number;
  isCorrect: boolean;
  pointsEarned: number;
}

export interface QuizAttempt {
  _id: string;
  quizId: string;
  userId?: string;
  answers: QuizAnswer[];
  score: number;
  totalPoints: number;
  percentage: number;
  timeSpent?: number;
  completedAt: string;
  createdAt: string;
}

export async function generateQuizFromDocument(
  documentId: string,
  type: "mcq" | "true-false" | "mixed",
  count: number,
  token: string
): Promise<{ questions: QuizQuestion[]; documentId: string }> {
  const r = await fetch(`${API_URL}/api/v1/documents/${documentId}/generate-quiz`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ type, count }),
  });

  if (!r.ok) {
    const error = await r.json().catch(() => ({}));
    throw new Error(error?.message || "Failed to generate quiz");
  }

  return r.json();
}

export async function createQuiz(
  payload: {
    title: string;
    documentId: string;
    questions: QuizQuestion[];
    timeLimit?: number;
    tags?: string[];
  },
  token: string
): Promise<Quiz> {
  const r = await fetch(`${API_URL}/api/v1/quizzes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!r.ok) {
    const error = await r.json().catch(() => ({}));
    throw new Error(error?.message || "Failed to create quiz");
  }

  return r.json();
}

// ✅ Fixed: Added auth token
export async function listQuizzes(documentId?: string): Promise<Quiz[]> {
  const token = localStorage.getItem('nm_token');
  const url = documentId
    ? `${API_URL}/api/v1/quizzes?documentId=${documentId}`
    : `${API_URL}/api/v1/quizzes`;

  const r = await fetch(url, {
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  });
  if (!r.ok) throw new Error("Failed to list quizzes");
  return r.json();
}

// ✅ Fixed: Added auth token
export async function getQuiz(quizId: string): Promise<Quiz> {
  const token = localStorage.getItem('nm_token');
  const r = await fetch(`${API_URL}/api/v1/quizzes/${quizId}`, {
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  });
  if (!r.ok) throw new Error("Failed to get quiz");
  return r.json();
}

export async function submitQuizAttempt(
  quizId: string,
  answers: Array<{ questionIndex: number; userAnswer: string | number }>,
  timeSpent: number,
  token: string
): Promise<QuizAttempt> {
  const r = await fetch(`${API_URL}/api/v1/quizzes/${quizId}/attempt`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ answers, timeSpent }),
  });

  if (!r.ok) {
    const error = await r.json().catch(() => ({}));
    throw new Error(error?.message || "Failed to submit quiz attempt");
  }

  return r.json();
}

// ✅ Fixed: Added auth token
export async function getQuizAttempts(quizId: string): Promise<QuizAttempt[]> {
  const token = localStorage.getItem('nm_token');
  const r = await fetch(`${API_URL}/api/v1/quizzes/${quizId}/attempts`, {
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  });
  if (!r.ok) throw new Error("Failed to get quiz attempts");
  return r.json();
}

export async function deleteQuiz(quizId: string, token: string): Promise<void> {
  const r = await fetch(`${API_URL}/api/v1/quizzes/${quizId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!r.ok) {
    const error = await r.json().catch(() => ({}));
    throw new Error(error?.message || "Failed to delete quiz");
  }
}