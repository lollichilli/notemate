import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

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

export async function generateFlashcardsFromDocument(
  documentId: string,
  type: 'qa' | 'mc',
  count: number,
  token: string
): Promise<GeneratedFlashcard[]> {
  console.log('Calling API with token:', token.substring(0, 20) + '...'); // Debug
  console.log('Document ID:', documentId);
  console.log('Type:', type, 'Count:', count);
  
  const response = await axios.post(
    `${API_URL}/api/v1/documents/${documentId}/generate-flashcards`,
    { type, count },
    { 
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      } 
    }
  );
  return response.data.flashcards;
}