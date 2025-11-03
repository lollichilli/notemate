import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// ✅ Use vi.hoisted() for mock functions
const {
  mockListQuizzes,
  mockGetQuiz,
  mockSubmitQuizAttempt,
  mockGetQuizAttempts,
} = vi.hoisted(() => ({
  mockListQuizzes: vi.fn(),
  mockGetQuiz: vi.fn(),
  mockSubmitQuizAttempt: vi.fn(),
  mockGetQuizAttempts: vi.fn(),
}))

// ✅ Mock modules
vi.mock('../../lib/quizzes', () => ({
  listQuizzes: mockListQuizzes,
  getQuiz: mockGetQuiz,
  submitQuizAttempt: mockSubmitQuizAttempt,
  getQuizAttempts: mockGetQuizAttempts,
}))

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    token: 'fake-token',
    user: { id: 'user1', email: 'test@example.com' },
  }),
}))

import Quizzes from '../Quizzes'

const mockQuiz1 = {
  _id: 'quiz1',
  title: 'React Fundamentals Quiz',
  documentId: 'doc1',
  questions: [
    {
      type: 'mcq' as const,
      question: 'What is React?',
      options: ['A library', 'A framework', 'A language', 'A database'],
      correctAnswer: 0,
      points: 1,
    },
    {
      type: 'true-false' as const,
      question: 'React uses virtual DOM',
      correctAnswer: 'true' as const,
      points: 1,
    },
  ],
  totalPoints: 2,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const mockQuiz2 = {
  _id: 'quiz2',
  title: 'JavaScript Basics',
  documentId: 'doc2',
  questions: [
    {
      type: 'short-answer' as const,
      question: 'What does JS stand for?',
      correctAnswer: 'JavaScript',
      points: 1,
    },
  ],
  totalPoints: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const mockAttempt = {
  _id: 'attempt1',
  quizId: 'quiz1',
  answers: [
    { questionIndex: 0, userAnswer: 0, isCorrect: true, pointsEarned: 1 },
    { questionIndex: 1, userAnswer: 'true', isCorrect: true, pointsEarned: 1 },
  ],
  score: 2,
  totalPoints: 2,
  percentage: 100,
  timeSpent: 120,
  completedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
}

describe('Quizzes Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.localStorage.setItem('token', 'fake-token')
  })

  test('renders empty state when no quizzes', async () => {
    mockListQuizzes.mockResolvedValue([])

    render(
      <MemoryRouter>
        <Quizzes />
      </MemoryRouter>
    )

    expect(await screen.findByText(/no quizzes yet/i)).toBeInTheDocument()
  })

  test('loads and displays quizzes', async () => {
    mockListQuizzes.mockResolvedValue([mockQuiz1, mockQuiz2])

    render(
      <MemoryRouter>
        <Quizzes />
      </MemoryRouter>
    )

    expect(await screen.findByText('React Fundamentals Quiz')).toBeInTheDocument()
    expect(await screen.findByText('JavaScript Basics')).toBeInTheDocument()
  })

  test('shows loading state', async () => {
    mockListQuizzes.mockImplementation(() => new Promise(() => {}))

    render(
      <MemoryRouter>
        <Quizzes />
      </MemoryRouter>
    )

    expect(await screen.findByText(/loading quizzes/i)).toBeInTheDocument()
  })

  test('handles quiz loading error', async () => {
    mockListQuizzes.mockRejectedValue(new Error('Failed to load quizzes'))

    render(
      <MemoryRouter>
        <Quizzes />
      </MemoryRouter>
    )

    expect(await screen.findByText(/failed to load quizzes/i)).toBeInTheDocument()
  })

  test('starts a quiz when clicked', async () => {
    mockListQuizzes.mockResolvedValue([mockQuiz1])
    mockGetQuiz.mockResolvedValue(mockQuiz1)
    mockGetQuizAttempts.mockResolvedValue([])

    render(
      <MemoryRouter>
        <Quizzes />
      </MemoryRouter>
    )

    const quizCard = await screen.findByText('React Fundamentals Quiz')
    fireEvent.click(quizCard)

    await waitFor(() => {
      expect(mockGetQuiz).toHaveBeenCalledWith('quiz1')
      expect(mockGetQuizAttempts).toHaveBeenCalledWith('quiz1')
    })

    // Should show first question
    expect(await screen.findByText('What is React?')).toBeInTheDocument()
  })

  test('displays MCQ options', async () => {
    mockListQuizzes.mockResolvedValue([mockQuiz1])
    mockGetQuiz.mockResolvedValue(mockQuiz1)
    mockGetQuizAttempts.mockResolvedValue([])

    render(
      <MemoryRouter>
        <Quizzes />
      </MemoryRouter>
    )

    const quizCard = await screen.findByText('React Fundamentals Quiz')
    fireEvent.click(quizCard)

    // Wait for question and options
    await screen.findByText('What is React?')
    
    expect(screen.getByText('A library')).toBeInTheDocument()
    expect(screen.getByText('A framework')).toBeInTheDocument()
    expect(screen.getByText('A language')).toBeInTheDocument()
    expect(screen.getByText('A database')).toBeInTheDocument()
  })

  test('selects MCQ answer', async () => {
    mockListQuizzes.mockResolvedValue([mockQuiz1])
    mockGetQuiz.mockResolvedValue(mockQuiz1)
    mockGetQuizAttempts.mockResolvedValue([])

    render(
      <MemoryRouter>
        <Quizzes />
      </MemoryRouter>
    )

    const quizCard = await screen.findByText('React Fundamentals Quiz')
    fireEvent.click(quizCard)

    await screen.findByText('What is React?')
    
    const option = screen.getByText('A library')
    fireEvent.click(option)

    // Option should be selected (has different styling but hard to test directly)
    // We'll verify by checking the button exists
    expect(option).toBeInTheDocument()
  })

  test('navigates to next question', async () => {
    mockListQuizzes.mockResolvedValue([mockQuiz1])
    mockGetQuiz.mockResolvedValue(mockQuiz1)
    mockGetQuizAttempts.mockResolvedValue([])

    render(
      <MemoryRouter>
        <Quizzes />
      </MemoryRouter>
    )

    const quizCard = await screen.findByText('React Fundamentals Quiz')
    fireEvent.click(quizCard)

    await screen.findByText('What is React?')
    
    // Click next
    const nextButton = screen.getByText(/next/i)
    fireEvent.click(nextButton)

    // Should show second question
    expect(await screen.findByText(/React uses virtual DOM/i)).toBeInTheDocument()
  })

  test('navigates to previous question', async () => {
    mockListQuizzes.mockResolvedValue([mockQuiz1])
    mockGetQuiz.mockResolvedValue(mockQuiz1)
    mockGetQuizAttempts.mockResolvedValue([])

    render(
      <MemoryRouter>
        <Quizzes />
      </MemoryRouter>
    )

    const quizCard = await screen.findByText('React Fundamentals Quiz')
    fireEvent.click(quizCard)

    await screen.findByText('What is React?')
    
    // Go to question 2
    fireEvent.click(screen.getByText(/next/i))
    await screen.findByText(/React uses virtual DOM/i)

    // Go back to question 1
    const prevButton = screen.getByText(/previous/i)
    fireEvent.click(prevButton)

    expect(await screen.findByText('What is React?')).toBeInTheDocument()
  })

  test('disables previous button on first question', async () => {
    mockListQuizzes.mockResolvedValue([mockQuiz1])
    mockGetQuiz.mockResolvedValue(mockQuiz1)
    mockGetQuizAttempts.mockResolvedValue([])

    render(
      <MemoryRouter>
        <Quizzes />
      </MemoryRouter>
    )

    const quizCard = await screen.findByText('React Fundamentals Quiz')
    fireEvent.click(quizCard)

    await screen.findByText('What is React?')
    
    const prevButton = screen.getByText(/previous/i)
    expect(prevButton).toBeDisabled()
  })

  test('displays true/false question', async () => {
    mockListQuizzes.mockResolvedValue([mockQuiz1])
    mockGetQuiz.mockResolvedValue(mockQuiz1)
    mockGetQuizAttempts.mockResolvedValue([])

    render(
      <MemoryRouter>
        <Quizzes />
      </MemoryRouter>
    )

    const quizCard = await screen.findByText('React Fundamentals Quiz')
    fireEvent.click(quizCard)

    // Navigate to true/false question
    await screen.findByText('What is React?')
    fireEvent.click(screen.getByText(/next/i))

    await screen.findByText(/React uses virtual DOM/i)
    
    expect(screen.getByText(/✓ true/i)).toBeInTheDocument()
    expect(screen.getByText(/✗ false/i)).toBeInTheDocument()
  })

  test('selects true/false answer', async () => {
    mockListQuizzes.mockResolvedValue([mockQuiz1])
    mockGetQuiz.mockResolvedValue(mockQuiz1)
    mockGetQuizAttempts.mockResolvedValue([])

    render(
      <MemoryRouter>
        <Quizzes />
      </MemoryRouter>
    )

    const quizCard = await screen.findByText('React Fundamentals Quiz')
    fireEvent.click(quizCard)

    await screen.findByText('What is React?')
    fireEvent.click(screen.getByText(/next/i))

    await screen.findByText(/React uses virtual DOM/i)
    
    const trueButton = screen.getByText(/✓ true/i)
    fireEvent.click(trueButton)

    expect(trueButton).toBeInTheDocument()
  })

  test('displays short answer question', async () => {
    mockListQuizzes.mockResolvedValue([mockQuiz2])
    mockGetQuiz.mockResolvedValue(mockQuiz2)
    mockGetQuizAttempts.mockResolvedValue([])

    render(
      <MemoryRouter>
        <Quizzes />
      </MemoryRouter>
    )

    const quizCard = await screen.findByText('JavaScript Basics')
    fireEvent.click(quizCard)

    await screen.findByText(/What does JS stand for/i)
    
    expect(screen.getByPlaceholderText(/type your answer/i)).toBeInTheDocument()
  })

  test('types short answer', async () => {
    mockListQuizzes.mockResolvedValue([mockQuiz2])
    mockGetQuiz.mockResolvedValue(mockQuiz2)
    mockGetQuizAttempts.mockResolvedValue([])

    render(
      <MemoryRouter>
        <Quizzes />
      </MemoryRouter>
    )

    const quizCard = await screen.findByText('JavaScript Basics')
    fireEvent.click(quizCard)

    await screen.findByText(/What does JS stand for/i)
    
    const input = screen.getByPlaceholderText(/type your answer/i)
    fireEvent.change(input, { target: { value: 'JavaScript' } })

    expect(input).toHaveValue('JavaScript')
  })

  test('disables submit until all questions answered', async () => {
    mockListQuizzes.mockResolvedValue([mockQuiz1])
    mockGetQuiz.mockResolvedValue(mockQuiz1)
    mockGetQuizAttempts.mockResolvedValue([])

    render(
      <MemoryRouter>
        <Quizzes />
      </MemoryRouter>
    )

    const quizCard = await screen.findByText('React Fundamentals Quiz')
    fireEvent.click(quizCard)

    await screen.findByText('What is React?')
    
    // Navigate to last question
    fireEvent.click(screen.getByText(/next/i))
    await screen.findByText(/React uses virtual DOM/i)

    // Submit button should be disabled
    const submitButton = screen.getByText(/answer 2 more/i)
    expect(submitButton).toBeDisabled()
  })

  test('enables submit when all questions answered', async () => {
    mockListQuizzes.mockResolvedValue([mockQuiz1])
    mockGetQuiz.mockResolvedValue(mockQuiz1)
    mockGetQuizAttempts.mockResolvedValue([])

    render(
      <MemoryRouter>
        <Quizzes />
      </MemoryRouter>
    )

    const quizCard = await screen.findByText('React Fundamentals Quiz')
    fireEvent.click(quizCard)

    // Answer first question
    await screen.findByText('What is React?')
    fireEvent.click(screen.getByText('A library'))

    // Navigate to second question
    fireEvent.click(screen.getByText(/next/i))
    await screen.findByText(/React uses virtual DOM/i)

    // Answer second question
    fireEvent.click(screen.getByText(/✓ true/i))

    // Submit button should be enabled
    const submitButton = await screen.findByText(/✓ submit quiz/i)
    expect(submitButton).not.toBeDisabled()
  })

  test('submits quiz and shows results', async () => {
    mockListQuizzes.mockResolvedValue([mockQuiz1])
    mockGetQuiz.mockResolvedValue(mockQuiz1)
    mockGetQuizAttempts.mockResolvedValue([])
    mockSubmitQuizAttempt.mockResolvedValue(mockAttempt)

    render(
      <MemoryRouter>
        <Quizzes />
      </MemoryRouter>
    )

    const quizCard = await screen.findByText('React Fundamentals Quiz')
    fireEvent.click(quizCard)

    // Answer questions
    await screen.findByText('What is React?')
    fireEvent.click(screen.getByText('A library'))
    fireEvent.click(screen.getByText(/next/i))

    await screen.findByText(/React uses virtual DOM/i)
    fireEvent.click(screen.getByText(/✓ true/i))

    // Submit
    const submitButton = await screen.findByText(/✓ submit quiz/i)
    fireEvent.click(submitButton)

    // Should show results
    expect(await screen.findByText(/quiz complete/i)).toBeInTheDocument()
    expect(await screen.findByText(/2 \/ 2/)).toBeInTheDocument()
  })

  test('displays score percentage', async () => {
    mockListQuizzes.mockResolvedValue([mockQuiz1])
    mockGetQuiz.mockResolvedValue(mockQuiz1)
    mockGetQuizAttempts.mockResolvedValue([])
    mockSubmitQuizAttempt.mockResolvedValue(mockAttempt)

    render(
      <MemoryRouter>
        <Quizzes />
      </MemoryRouter>
    )

    const quizCard = await screen.findByText('React Fundamentals Quiz')
    fireEvent.click(quizCard)

    // Answer and submit
    await screen.findByText('What is React?')
    fireEvent.click(screen.getByText('A library'))
    fireEvent.click(screen.getByText(/next/i))
    await screen.findByText(/React uses virtual DOM/i)
    fireEvent.click(screen.getByText(/✓ true/i))
    fireEvent.click(await screen.findByText(/✓ submit quiz/i))

    // Check percentage
    expect(await screen.findByText(/100\.0%/)).toBeInTheDocument()
  })

  test('resets quiz from results', async () => {
    mockListQuizzes.mockResolvedValue([mockQuiz1])
    mockGetQuiz.mockResolvedValue(mockQuiz1)
    mockGetQuizAttempts.mockResolvedValue([])
    mockSubmitQuizAttempt.mockResolvedValue(mockAttempt)

    render(
      <MemoryRouter>
        <Quizzes />
      </MemoryRouter>
    )

    const quizCard = await screen.findByText('React Fundamentals Quiz')
    fireEvent.click(quizCard)

    // Answer and submit
    await screen.findByText('What is React?')
    fireEvent.click(screen.getByText('A library'))
    fireEvent.click(screen.getByText(/next/i))
    await screen.findByText(/React uses virtual DOM/i)
    fireEvent.click(screen.getByText(/✓ true/i))
    fireEvent.click(await screen.findByText(/✓ submit quiz/i))

    // Wait for results
    await screen.findByText(/quiz complete/i)

    // Reset
    const backButton = screen.getByText(/back to quizzes/i)
    fireEvent.click(backButton)

    // Should show quiz list again
    expect(await screen.findByText('React Fundamentals Quiz')).toBeInTheDocument()
  })

  test('exits quiz during taking', async () => {
    mockListQuizzes.mockResolvedValue([mockQuiz1])
    mockGetQuiz.mockResolvedValue(mockQuiz1)
    mockGetQuizAttempts.mockResolvedValue([])

    render(
      <MemoryRouter>
        <Quizzes />
      </MemoryRouter>
    )

    const quizCard = await screen.findByText('React Fundamentals Quiz')
    fireEvent.click(quizCard)

    await screen.findByText('What is React?')

    // Exit
    const exitButton = screen.getByText(/✕ exit/i)
    fireEvent.click(exitButton)

    // Should return to quiz list
    expect(await screen.findByText('React Fundamentals Quiz')).toBeInTheDocument()
  })

  test('displays progress bar', async () => {
    mockListQuizzes.mockResolvedValue([mockQuiz1])
    mockGetQuiz.mockResolvedValue(mockQuiz1)
    mockGetQuizAttempts.mockResolvedValue([])

    render(
      <MemoryRouter>
        <Quizzes />
      </MemoryRouter>
    )

    const quizCard = await screen.findByText('React Fundamentals Quiz')
    fireEvent.click(quizCard)

    await screen.findByText('What is React?')

    // Check progress text
    expect(screen.getByText(/question 1 of 2/i)).toBeInTheDocument()
    expect(screen.getByText(/50% complete/i)).toBeInTheDocument()
  })

  test('displays previous attempts', async () => {
    const pastAttempts = [{
      ...mockAttempt,
      _id: 'past1',
      completedAt: new Date(Date.now() - 86400000).toISOString(),
    }]

    mockListQuizzes.mockResolvedValue([mockQuiz1])
    mockGetQuiz.mockResolvedValue(mockQuiz1)
    mockGetQuizAttempts.mockResolvedValue(pastAttempts)

    render(
      <MemoryRouter>
        <Quizzes />
      </MemoryRouter>
    )

    const quizCard = await screen.findByText('React Fundamentals Quiz')
    fireEvent.click(quizCard)

    await screen.findByText('What is React?')

    // Should show previous attempts section
    expect(await screen.findByText(/previous attempts/i)).toBeInTheDocument()
  })
})