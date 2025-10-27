import { Schema, model, Types } from "mongoose";

export interface IQuizQuestion {
  type: "mcq" | "true-false" | "short-answer";
  question: string;
  options?: string[]; // For MCQ
  correctAnswer: string | number; // For MCQ: index, for true-false: "true"/"false", for short: the answer
  explanation?: string;
  points?: number;
}

export interface IQuiz {
  _id: Types.ObjectId;
  title: string;
  documentId: Types.ObjectId;
  createdBy?: Types.ObjectId | null;
  questions: IQuizQuestion[];
  totalPoints: number;
  timeLimit?: number; // minutes
  tags?: string[];
}

const QuizQuestionSchema = new Schema<IQuizQuestion>({
  type: { type: String, enum: ["mcq", "true-false", "short-answer"], required: true },
  question: { type: String, required: true },
  options: { type: [String], default: [] },
  correctAnswer: { type: Schema.Types.Mixed, required: true },
  explanation: { type: String },
  points: { type: Number, default: 1 }
}, { _id: false });

const QuizSchema = new Schema<IQuiz>(
  {
    title: { type: String, required: true },
    documentId: { type: Schema.Types.ObjectId, ref: "Document", required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    questions: { type: [QuizQuestionSchema], default: [] },
    totalPoints: { type: Number, default: 0 },
    timeLimit: { type: Number },
    tags: { type: [String], default: [] }
  },
  { timestamps: true }
);

QuizSchema.index({ documentId: 1, createdAt: -1 });

export const quiz = model<IQuiz>("Quiz", QuizSchema);