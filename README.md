# NoteMate

> An intelligent note-taking platform with AI-powered flashcards, spaced repetition learning, and interactive quizzes.

**Live Demo:** [https://notemate-one.vercel.app](https://notemate-one.vercel.app)

---

## Overview

NoteMate transforms your study documents into interactive learning experiences. Upload PDFs or Markdown files, and let AI generate flashcards and quizzes to help you master the material through spaced repetition learning.

### Key Features

- **Smart Document Processing** - Upload PDFs or Markdown files, automatically parsed into structured blocks
- **AI-Powered Generation** - Create flashcards and quizzes from your documents using OpenAI
- **Spaced Repetition** - Leitner system for optimal learning retention
- **Quiz System** - Multiple choice, true/false, and short answer questions with detailed analytics
- **Progress Tracking** - Monitor your learning progress with detailed statistics
- **Secure Authentication** - JWT-based auth with bcrypt password hashing

---

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for blazing-fast development
- **React Router** for client-side routing
- **Vitest** + **React Testing Library** for comprehensive testing
- **Tailwind CSS** for styling (via inline styles)

### Backend
- **Node.js** + **Express**
- **TypeScript** for type safety
- **MongoDB** + **Mongoose** for data persistence
- **OpenAI API** for AI-powered content generation
- **Jest** + **Supertest** for API testing
- **MongoDB Memory Server** for isolated test environments

### Infrastructure
- **Frontend:** Deployed on Vercel
- **Backend:** Deployed on Render
- **Database:** MongoDB Atlas
- **CI/CD:** Automated deployments via Git

---

## Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│  React Frontend │────────▶│  Express API    │────────▶│  MongoDB Atlas  │
│  (Vercel)       │         │  (Render)       │         │                 │
│                 │         │                 │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
                                     │
                                     │
                                     ▼
                            ┌─────────────────┐
                            │   OpenAI API    │
                            │  (GPT-4)        │
                            └─────────────────┘
```

---

## Project Structure

```
notemate/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # React components (Decks, Documents, Quizzes)
│   │   ├── lib/           # API client libraries
│   │   ├── contexts/      # React context (Auth)
│   │   └── pages/tests/   # Frontend tests (58 tests)
│   └── package.json
│
├── server/                 # Express backend
│   ├── src/
│   │   ├── controllers/   # Route handlers
│   │   ├── models/        # Mongoose schemas
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic (OpenAI)
│   │   ├── middleware/    # Auth middleware
│   │   └── __tests__/     # Backend tests (163 tests)
│   └── package.json
│
└── README.md
```

---

## Test Coverage

This project has **comprehensive test coverage** across both frontend and backend:

### Frontend Tests (58 Tests)
- **Decks Component** - 17 tests (list, create, study session, Leitner system)
- **Documents Component** - 11 tests (upload, parse, blocks)
- **Quizzes Component** - 30 tests (create, take, submit, scoring)

### Backend Tests (163 Tests)
- **Authentication** - 7 tests (signup, login, validation)
- **Decks API** - 14 tests (CRUD operations)
- **Flashcards API** - 36 tests (create, review, Leitner progression)
- **Documents API** - 48 tests (create, parse MD/PDF, blocks)
- **Quizzes API** - 58 tests (create, submit, grading, attempts)

**Run tests:**
```bash
# Frontend tests
cd client && npm test

# Backend tests
cd server && npm test

# With coverage
npm run test:coverage
```

---

## Getting Started

### Prerequisites
- Node.js 18+ 
- MongoDB (local or Atlas)
- OpenAI API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/notemate.git
   cd notemate
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd server
   npm install

   # Install frontend dependencies
   cd ../client
   npm install
   ```

3. **Configure environment variables**

   **Backend (`server/.env`):**
   ```env
   PORT=4000
   MONGODB_URI=mongodb://localhost:27017/notemate
   JWT_SECRET=your-secret-key-here
   OPENAI_API_KEY=sk-your-openai-key
   WEB_ORIGIN=http://localhost:5173
   ```

   **Frontend (`client/.env.local`):**
   ```env
   VITE_API_URL=http://localhost:4000
   ```

4. **Start the development servers**

   ```bash
   # Terminal 1 - Backend
   cd server
   npm run dev

   # Terminal 2 - Frontend
   cd client
   npm run dev
   ```

5. **Open your browser**
   ```
   http://localhost:5173
   ```

---

## API Documentation

### Authentication

#### `POST /api/v1/auth/signup`
Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "token": "jwt-token",
  "user": {
    "_id": "user-id",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### `POST /api/v1/auth/login`
Login with existing credentials.

---

### Decks

#### `GET /api/v1/decks`
List all decks (max 50, sorted by most recent).

#### `POST /api/v1/decks`
Create a new flashcard deck.

**Request:**
```json
{
  "name": "Biology 101"
}
```

#### `GET /api/v1/decks/:id/cards`
Get all flashcards in a deck.

---

### Flashcards

#### `POST /api/v1/decks/:id/cards`
Create a flashcard in a deck.

**Request:**
```json
{
  "type": "basic",
  "prompt": "What is photosynthesis?",
  "answer": "The process by which plants convert light into energy"
}
```

#### `GET /api/v1/decks/:id/due`
Get cards due for review (Leitner system).

#### `POST /api/v1/cards/:id/review`
Record a review result.

**Request:**
```json
{
  "result": "gotit" // or "again"
}
```

---

### Documents

#### `GET /api/v1/documents`
List all documents.

#### `POST /api/v1/documents`
Create a new document.

**Request:**
```json
{
  "title": "Chapter 1: Introduction"
}
```

#### `POST /api/v1/documents/:id/parse-md`
Parse Markdown content into blocks.

**Request:**
```json
{
  "markdown": "# Heading\n\nParagraph content..."
}
```

#### `POST /api/v1/documents/:id/parse-pdf`
Parse PDF file into blocks (multipart/form-data with `file` field).

#### `GET /api/v1/documents/:id/blocks`
Get all content blocks for a document.

---

### Quizzes

#### `POST /api/v1/documents/:documentId/generate-quiz`
Generate quiz from document using AI.

**Request:**
```json
{
  "type": "mcq", // or "true-false" or "mixed"
  "count": 10    // 5, 10, 15, or 20
}
```

#### `POST /api/v1/quizzes`
Create a quiz manually.

**Request:**
```json
{
  "title": "Chapter 1 Quiz",
  "documentId": "doc-id",
  "questions": [
    {
      "type": "mcq",
      "question": "What is 2+2?",
      "options": ["3", "4", "5"],
      "correctAnswer": 1,
      "points": 1
    }
  ],
  "timeLimit": 30
}
```

#### `GET /api/v1/quizzes`
List all quizzes (filter by `?documentId=...`).

#### `GET /api/v1/quizzes/:id`
Get a specific quiz.

#### `POST /api/v1/quizzes/:id/attempt`
Submit quiz answers.

**Request:**
```json
{
  "answers": [
    {
      "questionIndex": 0,
      "userAnswer": 1
    }
  ],
  "timeSpent": 120
}
```

**Response:**
```json
{
  "score": 8,
  "totalPoints": 10,
  "percentage": 80,
  "answers": [
    {
      "questionIndex": 0,
      "userAnswer": 1,
      "isCorrect": true,
      "pointsEarned": 1
    }
  ]
}
```

#### `GET /api/v1/quizzes/:id/attempts`
Get all attempts for a quiz.

#### `DELETE /api/v1/quizzes/:id`
Delete a quiz and its attempts.

---

## Learning Features

### Leitner Spaced Repetition System

NoteMate implements the **Leitner system** for optimal learning:

- **Box 1:** Review tomorrow (1 day)
- **Box 2:** Review in 2 days
- **Box 3:** Review in 4 days
- **Box 4:** Review in 8 days
- **Box 5:** Review in 16 days

**How it works:**
1. All new cards start in Box 1
2. Correct answer → Move to next box
3. Wrong answer → Back to Box 1
4. Cards automatically scheduled based on box level

---

## Security

- **Password Hashing:** bcrypt with salt rounds
- **JWT Authentication:** Secure token-based auth
- **CORS Protection:** Configured for specific origins
- **Input Validation:** Comprehensive request validation
- **Environment Variables:** Sensitive data never committed

---

## Database Schema

### User
```typescript
{
  _id: ObjectId,
  email: string,
  password: string (hashed),
  name?: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Deck
```typescript
{
  _id: ObjectId,
  name: string,
  ownerId?: ObjectId,
  visibility: "private" | "workspace",
  createdAt: Date,
  updatedAt: Date
}
```

### Flashcard
```typescript
{
  _id: ObjectId,
  deckId: ObjectId,
  type: "basic" | "cloze" | "mcq",
  prompt: string,
  answer: string,
  leitner: {
    box: number (1-5),
    nextReviewAt: Date
  },
  stats: {
    correct: number,
    incorrect: number
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Document
```typescript
{
  _id: ObjectId,
  title: string,
  source: {
    fileType: "md" | "pdf",
    originalName: string,
    sizeBytes: number,
    storageKey: string
  },
  parse: {
    status: "pending" | "done" | "failed",
    pages?: number,
    engine?: string
  },
  tags: string[],
  createdAt: Date,
  updatedAt: Date
}
```

### Quiz
```typescript
{
  _id: ObjectId,
  title: string,
  documentId: ObjectId,
  questions: [
    {
      type: "mcq" | "true-false" | "short-answer",
      question: string,
      options?: string[],
      correctAnswer: string | number,
      points: number
    }
  ],
  totalPoints: number,
  timeLimit?: number,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Deployment

### Frontend (Vercel)

1. **Connect GitHub repository**
2. **Configure build settings:**
   - Framework Preset: Vite
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Set environment variables:**
   ```
   VITE_API_URL=https://your-backend-url.com
   ```

### Backend (Render)

1. **Create Web Service**
2. **Configure build settings:**
   - Root Directory: `server`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

3. **Set environment variables:**
   ```
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=your-secret
   OPENAI_API_KEY=sk-...
   NODE_ENV=production
   ```

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License.

---

## Author

**Tung Nguyen**

---

## Acknowledgments

- OpenAI for GPT-4 API
- MongoDB for database hosting
- Vercel and Render for deployment platforms
- The open-source community for amazing tools

---

## Future Enhancements

- [ ] Summary of lecture notes
- [ ] Offline mode with sync
- [ ] Social features (share decks)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Audio flashcards
- [ ] Image occlusion cards

---

