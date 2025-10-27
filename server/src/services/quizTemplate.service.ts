// src/services/quizTemplate.service.ts
export function buildQuizPrompt(content: string, count: number) {
  return `
You are an experienced educator creating study quizzes.
Generate exactly ${count} quiz questions from the following notes.

Rules:
- Vary difficulty (easy/medium/hard)
- Use clear, concise language
- Avoid duplicate questions
- Return JSON ONLY in this format:

{
  "items": [
    {
      "question": "string",
      "answer": "string",
      "difficulty": "easy|medium|hard"
    }
  ]
}

Notes:
${content}
  `.trim();
}
