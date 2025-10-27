import { Schema, model, Types } from "mongoose";

export interface IQuizAnswer {
  questionIndex: number;
  userAnswer: string | number;
  isCorrect: boolean;
  pointsEarned: number;
}

export interface IQuizAttempt {
  _id: Types.ObjectId;
  quizId: Types.ObjectId;
  userId?: Types.ObjectId | null;
  answers: IQuizAnswer[];
  score: number; // Points earned
  totalPoints: number; // Total possible points
  percentage: number;
  timeSpent?: number; // seconds
  completedAt: Date;
}

const QuizAnswerSchema = new Schema<IQuizAnswer>({
  questionIndex: { type: Number, required: true },
  userAnswer: { type: Schema.Types.Mixed, required: true },
  isCorrect: { type: Boolean, required: true },
  pointsEarned: { type: Number, default: 0 }
}, { _id: false });

const QuizAttemptSchema = new Schema<IQuizAttempt>(
  {
    quizId: { type: Schema.Types.ObjectId, ref: "Quiz", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    answers: { type: [QuizAnswerSchema], default: [] },
    score: { type: Number, required: true },
    totalPoints: { type: Number, required: true },
    percentage: { type: Number, required: true },
    timeSpent: { type: Number },
    completedAt: { type: Date, default: () => new Date() }
  },
  { timestamps: true }
);

QuizAttemptSchema.index({ quizId: 1, userId: 1, createdAt: -1 });

export const quizAttempt = model<IQuizAttempt>("QuizAttempt", QuizAttemptSchema);