import OpenAI from 'openai';

export interface FlashcardQA {
  type: 'qa';
  question: string;
  answer: string;
}

export interface FlashcardMC {
  type: 'mc';
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export type Flashcard = FlashcardQA | FlashcardMC;

interface GenerateFlashcardsParams {
  content: string;
  type: 'qa' | 'mc';
  count: number;
}

export interface QuizQuestionMCQ {
  type: 'mcq';
  question: string;
  options: string[];
  correctAnswer: number; // index of correct option
  explanation?: string;
  points?: number;
}

export interface QuizQuestionTrueFalse {
  type: 'true-false';
  question: string;
  correctAnswer: 'true' | 'false';
  explanation?: string;
  points?: number;
}

export interface QuizQuestionShortAnswer {
  type: 'short-answer';
  question: string;
  correctAnswer: string;
  explanation?: string;
  points?: number;
}

export type QuizQuestion = QuizQuestionMCQ | QuizQuestionTrueFalse | QuizQuestionShortAnswer;

interface GenerateQuizParams {
  content: string;
  type: 'mcq' | 'true-false' | 'mixed';
  count: number;
}

export async function generateFlashcards({
  content,
  type,
  count,
}: GenerateFlashcardsParams): Promise<Flashcard[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set in environment variables');
  }
  const openai = new OpenAI({ apiKey });

  const systemPrompt = `You are an expert educator creating study flashcards. Generate exactly ${count} flashcards from the provided content.`;
  
  const userPrompt =
    type === 'qa'
      ? `Create ${count} question-and-answer flashcards from this content. Focus on key concepts, definitions, and important facts.

Content:
${content}

Return ONLY a valid JSON object with a "flashcards" array in this exact format:
{
  "flashcards": [
    {
      "type": "qa",
      "question": "What is...",
      "answer": "..."
    }
  ]
}`
      : `Create ${count} multiple-choice flashcards from this content. Each should have 4 options with one correct answer.

Content:
${content}

Return ONLY a valid JSON object with a "flashcards" array in this exact format:
{
  "flashcards": [
    {
      "type": "mc",
      "question": "Which of the following...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Brief explanation why this is correct"
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content_text = response.choices[0]?.message?.content;
    if (!content_text) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content_text);
    const flashcards = parsed.flashcards || [];
    
    if (!Array.isArray(flashcards)) {
      throw new Error('Invalid response format from OpenAI');
    }

    return flashcards;
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    throw new Error(`Failed to generate flashcards: ${error.message}`);
  }
}

export async function generateQuiz({
  content,
  type,
  count,
}: GenerateQuizParams): Promise<QuizQuestion[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set in environment variables');
  }
  const openai = new OpenAI({ apiKey });

  const systemPrompt = `You are an expert educator creating assessment quizzes. Generate exactly ${count} quiz questions from the provided content that test understanding and knowledge retention.`;
  
  let userPrompt = '';
  
  if (type === 'mcq') {
    userPrompt = `Create ${count} multiple-choice questions from this content. Each question should have 4 options with one correct answer.

Content:
${content}

Return ONLY a valid JSON object with a "questions" array in this exact format:
{
  "questions": [
    {
      "type": "mcq",
      "question": "Which of the following best describes...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Brief explanation of why this is correct",
      "points": 1
    }
  ]
}`;
  } else if (type === 'true-false') {
    userPrompt = `Create ${count} true/false questions from this content.

Content:
${content}

Return ONLY a valid JSON object with a "questions" array in this exact format:
{
  "questions": [
    {
      "type": "true-false",
      "question": "The statement '...' is true.",
      "correctAnswer": "true",
      "explanation": "Brief explanation",
      "points": 1
    }
  ]
}`;
  } else {
    // mixed
    userPrompt = `Create ${count} mixed-type questions (multiple choice, true/false, and short answer) from this content to comprehensively test understanding.

Content:
${content}

Return ONLY a valid JSON object with a "questions" array in this exact format:
{
  "questions": [
    {
      "type": "mcq",
      "question": "Which...",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explanation": "...",
      "points": 1
    },
    {
      "type": "true-false",
      "question": "Statement...",
      "correctAnswer": "true",
      "explanation": "...",
      "points": 1
    },
    {
      "type": "short-answer",
      "question": "What is...",
      "correctAnswer": "Brief answer",
      "explanation": "...",
      "points": 2
    }
  ]
}`;
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content_text = response.choices[0]?.message?.content;
    if (!content_text) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content_text);
    const questions = parsed.questions || [];
    
    if (!Array.isArray(questions)) {
      throw new Error('Invalid response format from OpenAI');
    }

    return questions;
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    throw new Error(`Failed to generate quiz: ${error.message}`);
  }
}