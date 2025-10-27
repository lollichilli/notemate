import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Dashboard from '../Dashboard'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { email: 'test@example.com', name: 'Test User' },
  }),
}))

const mockListDocuments = vi.fn()
const mockListDecks = vi.fn()
const mockListQuizzes = vi.fn()

vi.mock('../../lib/documents', () => ({
  listDocuments: () => mockListDocuments(),
}))

vi.mock('../../lib/decks', () => ({
  listDecks: () => mockListDecks(),
}))

vi.mock('../../lib/quizzes', () => ({
  listQuizzes: () => mockListQuizzes(),
}))

describe('Dashboard Page', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    mockListDocuments.mockReset()
    mockListDecks.mockReset()
    mockListQuizzes.mockReset()
  })

  test('renders welcome message with user name', () => {
    mockListDocuments.mockResolvedValue([])
    mockListDecks.mockResolvedValue([])
    mockListQuizzes.mockResolvedValue([])

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    expect(screen.getByText('Test User')).toBeInTheDocument()
  })

  test('displays greeting based on time of day', () => {
    mockListDocuments.mockResolvedValue([])
    mockListDecks.mockResolvedValue([])
    mockListQuizzes.mockResolvedValue([])

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    const greetingRegex = /good (morning|afternoon|evening)/i
    expect(screen.getByText(greetingRegex)).toBeInTheDocument()
  })

  test('loads and displays stats correctly', async () => {
    const mockDocs = [
      { _id: '1', title: 'Doc 1', createdAt: new Date().toISOString() },
      { _id: '2', title: 'Doc 2', createdAt: new Date().toISOString() },
    ]
    const mockDecks = [{ _id: '1', name: 'Deck 1', createdAt: new Date().toISOString() }]
    const mockQuizzes = [
      { _id: '1', title: 'Quiz 1', createdAt: new Date().toISOString() },
      { _id: '2', title: 'Quiz 2', createdAt: new Date().toISOString() },
      { _id: '3', title: 'Quiz 3', createdAt: new Date().toISOString() },
    ]

    mockListDocuments.mockResolvedValue(mockDocs)
    mockListDecks.mockResolvedValue(mockDecks)
    mockListQuizzes.mockResolvedValue(mockQuizzes)

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument() // documents count
      expect(screen.getByText('1')).toBeInTheDocument() // decks count
      expect(screen.getByText('3')).toBeInTheDocument() // quizzes count
    })
  })

  test('shows loading state initially', () => {
    mockListDocuments.mockImplementation(() => new Promise(() => {}))
    mockListDecks.mockImplementation(() => new Promise(() => {}))
    mockListQuizzes.mockImplementation(() => new Promise(() => {}))

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    expect(screen.getAllByText('...')).toHaveLength(3)
  })

  test('handles API errors gracefully', async () => {
    mockListDocuments.mockRejectedValue(new Error('Failed to load'))
    mockListDecks.mockRejectedValue(new Error('Failed to load'))
    mockListQuizzes.mockRejectedValue(new Error('Failed to load'))

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    await waitFor(() => {
      // All three cards should show "0" when errors occur
      const zeros = screen.getAllByText('0')
      expect(zeros).toHaveLength(3)
    })
  })

  test('navigates to documents page when clicking document card', async () => {
    mockListDocuments.mockResolvedValue([])
    mockListDecks.mockResolvedValue([])
    mockListQuizzes.mockResolvedValue([])

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    await waitFor(() => {
      const documentCard = screen.getByTestId('stat-card-documents')
      fireEvent.click(documentCard)
      expect(mockNavigate).toHaveBeenCalledWith('/documents')
    })
  })

  test('navigates to decks page when clicking deck card', async () => {
    mockListDocuments.mockResolvedValue([])
    mockListDecks.mockResolvedValue([])
    mockListQuizzes.mockResolvedValue([])

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    await waitFor(() => {
      const deckCard = screen.getByTestId('stat-card-decks')
      fireEvent.click(deckCard)
      expect(mockNavigate).toHaveBeenCalledWith('/decks')
    })
  })

  test('navigates to quizzes page when clicking quiz card', async () => {
    mockListDocuments.mockResolvedValue([])
    mockListDecks.mockResolvedValue([])
    mockListQuizzes.mockResolvedValue([])

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    await waitFor(() => {
      const quizCard = screen.getByTestId('stat-card-quizzes')
      fireEvent.click(quizCard)
      expect(mockNavigate).toHaveBeenCalledWith('/quizzes')
    })
  })

  test('displays quick action buttons', async () => {
    mockListDocuments.mockResolvedValue([])
    mockListDecks.mockResolvedValue([])
    mockListQuizzes.mockResolvedValue([])

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('New Document')).toBeInTheDocument()
      expect(screen.getByText('New Deck')).toBeInTheDocument()
      expect(screen.getByText('Take Quiz')).toBeInTheDocument()
      expect(screen.getByText('Study Now')).toBeInTheDocument()
    })
  })

  test('quick action buttons navigate correctly', async () => {
    mockListDocuments.mockResolvedValue([])
    mockListDecks.mockResolvedValue([])
    mockListQuizzes.mockResolvedValue([])

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    await waitFor(() => {
      fireEvent.click(screen.getByText('New Document'))
      expect(mockNavigate).toHaveBeenCalledWith('/documents')

      fireEvent.click(screen.getByText('New Deck'))
      expect(mockNavigate).toHaveBeenCalledWith('/decks')

      fireEvent.click(screen.getByText('Take Quiz'))
      expect(mockNavigate).toHaveBeenCalledWith('/quizzes')
    })
  })

  test('displays getting started guide', () => {
    mockListDocuments.mockResolvedValue([])
    mockListDecks.mockResolvedValue([])
    mockListQuizzes.mockResolvedValue([])

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    expect(screen.getByText(/Getting Started/i)).toBeInTheDocument()
    expect(screen.getByText(/Upload Your Notes/i)).toBeInTheDocument()
    expect(screen.getByText(/Generate AI Content/i)).toBeInTheDocument()
    expect(screen.getByText(/Study & Track Progress/i)).toBeInTheDocument()
  })

  test('displays correct pluralization for stats', async () => {
    mockListDocuments.mockResolvedValue([
      { _id: '1', title: 'Doc 1', createdAt: new Date().toISOString() },
    ])
    mockListDecks.mockResolvedValue([])
    mockListQuizzes.mockResolvedValue([
      { _id: '1', title: 'Quiz 1', createdAt: new Date().toISOString() },
      { _id: '2', title: 'Quiz 2', createdAt: new Date().toISOString() },
    ])

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/document created/i)).toBeInTheDocument()
      expect(screen.getByText(/quizzes available/i)).toBeInTheDocument()
    })
  })
})