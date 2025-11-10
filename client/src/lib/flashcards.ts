import { API_URL } from "./api";

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

export type GeneratedFlashcard = FlashcardQA | FlashcardMC;

// ✅ Converted to fetch for consistency
export async function generateFlashcardsFromDocument(
  documentId: string,
  type: 'qa' | 'mc',
  count: number,
  token: string
): Promise<GeneratedFlashcard[]> {
  console.log('Calling API with token:', token.substring(0, 20) + '...'); // Debug
  console.log('Document ID:', documentId);
  console.log('Type:', type, 'Count:', count);
  
  const r = await fetch(`${API_URL}/api/v1/documents/${documentId}/generate-flashcards`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ type, count })
  });

  if (!r.ok) {
    const error = await r.json().catch(() => ({}));
    throw new Error(error?.message || 'Failed to generate flashcards');
  }

  const data = await r.json();
  return data.flashcards;
}