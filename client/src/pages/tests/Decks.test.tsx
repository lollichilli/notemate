import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Decks from '../Decks'
import { listDecks, createDeck, listCards, listDue, reviewCard } from '../../lib/decks'

// Mock the entire module
vi.mock('../../lib/decks', () => ({
  listDecks: vi.fn(),
  createDeck: vi.fn(),
  listCards: vi.fn(),
  listDue: vi.fn(),
  reviewCard: vi.fn(),
}))

const mockDeck1 = {
  _id: 'deck1',
  name: 'Test Deck 1',
  createdAt: new Date().toISOString(),
}

const mockCard1 = {
  _id: 'card1',
  prompt: 'What is React?',
  answer: 'A JavaScript library for building user interfaces',
  type: 'basic',
  leitner: {
    box: 1,
    nextReviewAt: new Date(Date.now() + 86400000).toISOString(),
  },
  stats: {
    correct: 5,
    incorrect: 2,
  },
}

const mockCard2 = {
  _id: 'card2',
  prompt: 'What is TypeScript?',
  answer: 'A typed superset of JavaScript',
  type: 'basic',
  leitner: {
    box: 2,
    nextReviewAt: new Date(Date.now() - 86400000).toISOString(), // Past date - due now
  },
  stats: {
    correct: 3,
    incorrect: 1,
  },
}

describe('Decks Page', () => {
  beforeEach(() => {
    vi.mocked(listDecks).mockReset()
    vi.mocked(createDeck).mockReset()
    vi.mocked(listCards).mockReset()
    vi.mocked(listDue).mockReset()
    vi.mocked(reviewCard).mockReset()
  })

  test('renders decks page with empty state', async () => {
    vi.mocked(listDecks).mockResolvedValue([])

    render(
      <MemoryRouter>
        <Decks />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/no decks yet/i)).toBeInTheDocument()
    })
  })

  test('loads and displays decks', async () => {
    vi.mocked(listDecks).mockResolvedValue([mockDeck1])
    vi.mocked(listCards).mockResolvedValue([])
    vi.mocked(listDue).mockResolvedValue([])

    render(
      <MemoryRouter>
        <Decks />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Test Deck 1')).toBeInTheDocument()
    })
  })

  test('creates a new deck', async () => {
    const newDeck = {
      _id: 'deck2',
      name: 'New Deck',
      createdAt: new Date().toISOString(),
    }

    vi.mocked(listDecks).mockResolvedValue([mockDeck1])
    vi.mocked(createDeck).mockResolvedValue(newDeck)
    vi.mocked(listCards).mockResolvedValue([])
    vi.mocked(listDue).mockResolvedValue([])

    render(
      <MemoryRouter>
        <Decks />
      </MemoryRouter>
    )

    const input = screen.getByPlaceholderText(/new deck name/i)
    const createButton = screen.getByText(/create deck/i)

    fireEvent.change(input, { target: { value: 'New Deck' } })
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(vi.mocked(createDeck)).toHaveBeenCalledWith('New Deck')
    })
  })

  test('disables create button when input is empty', async () => {
    vi.mocked(listDecks).mockResolvedValue([])

    render(
      <MemoryRouter>
        <Decks />
      </MemoryRouter>
    )

    const createButton = screen.getByText(/create deck/i)
    expect(createButton).toBeDisabled()
  })

  test('loads cards when deck is selected', async () => {
    vi.mocked(listDecks).mockResolvedValue([mockDeck1])
    vi.mocked(listCards).mockResolvedValue([mockCard1, mockCard2])
    vi.mocked(listDue).mockResolvedValue([mockCard2])

    render(
      <MemoryRouter>
        <Decks />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('What is React?')).toBeInTheDocument()
      expect(screen.getByText('What is TypeScript?')).toBeInTheDocument()
    })
  })

  test('displays card statistics correctly', async () => {
    vi.mocked(listDecks).mockResolvedValue([mockDeck1])
    vi.mocked(listCards).mockResolvedValue([mockCard1])
    vi.mocked(listDue).mockResolvedValue([])

    render(
      <MemoryRouter>
        <Decks />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/✓ 5/i)).toBeInTheDocument() // correct count
      expect(screen.getByText(/✗ 2/i)).toBeInTheDocument() // incorrect count
    })
  })

  test('starts study session with due cards', async () => {
    vi.mocked(listDecks).mockResolvedValue([mockDeck1])
    vi.mocked(listCards).mockResolvedValue([mockCard1, mockCard2])
    vi.mocked(listDue).mockResolvedValue([mockCard2])

    render(
      <MemoryRouter>
        <Decks />
      </MemoryRouter>
    )

    // Wait for deck to be fully loaded
    await waitFor(() => {
      expect(screen.getByText('Test Deck 1')).toBeInTheDocument()
      expect(screen.getByText(/1 due/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    // Click the button
    const studyButton = screen.getByTestId('study-due-button')
    expect(studyButton).not.toBeDisabled()
    fireEvent.click(studyButton)

    // Wait for the study session to start
    await waitFor(() => {
      expect(screen.getByText('What is TypeScript?')).toBeInTheDocument()
      expect(screen.getByText(/Card 1 of 1/i)).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  test('starts study session with all cards', async () => {
    vi.mocked(listDecks).mockResolvedValue([mockDeck1])
    vi.mocked(listCards).mockResolvedValue([mockCard1, mockCard2])
    vi.mocked(listDue).mockResolvedValue([])

    render(
      <MemoryRouter>
        <Decks />
      </MemoryRouter>
    )

    // Wait for deck to be fully loaded
    await waitFor(() => {
      expect(screen.getByText('Test Deck 1')).toBeInTheDocument()
      expect(screen.getByText(/0 due/i)).toBeInTheDocument()
      expect(screen.getByText(/2 total/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    // Click the button
    const studyButton = screen.getByTestId('study-all-button')
    expect(studyButton).not.toBeDisabled()
    fireEvent.click(studyButton)

    // Wait for the study session to start
    await waitFor(() => {
      expect(screen.getByText(/Card 1 of 2/i)).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  test('shows answer when button is clicked', async () => {
    vi.mocked(listDecks).mockResolvedValue([mockDeck1])
    vi.mocked(listCards).mockResolvedValue([mockCard1])
    vi.mocked(listDue).mockResolvedValue([mockCard1])

    render(
      <MemoryRouter>
        <Decks />
      </MemoryRouter>
    )

    // Wait for deck to be fully loaded
    await waitFor(() => {
      expect(screen.getByText('Test Deck 1')).toBeInTheDocument()
      expect(screen.getByText(/1 due/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    // Click Study Due
    const studyButton = screen.getByTestId('study-due-button')
    expect(studyButton).not.toBeDisabled()
    fireEvent.click(studyButton)

    // Wait for study session to start - use progress counter
    await waitFor(() => {
      expect(screen.getByText(/Card 1 of 1/i)).toBeInTheDocument()
    }, { timeout: 5000 })

    // Click Show Answer
    fireEvent.click(screen.getByTestId('show-answer-button'))

    // Verify answer and buttons appear
    await waitFor(() => {
      expect(screen.getByText('A JavaScript library for building user interfaces')).toBeInTheDocument()
      expect(screen.getByTestId('again-button')).toBeInTheDocument()
      expect(screen.getByTestId('got-it-button')).toBeInTheDocument()
    })
  })

  test('handles "Got It" review correctly', async () => {
    vi.mocked(listDecks).mockResolvedValue([mockDeck1])
    vi.mocked(listCards).mockResolvedValue([mockCard1, mockCard2])
    vi.mocked(listDue).mockResolvedValue([mockCard1, mockCard2])
    vi.mocked(reviewCard).mockResolvedValue(undefined)

    render(
      <MemoryRouter>
        <Decks />
      </MemoryRouter>
    )

    // Wait for deck to be fully loaded
    await waitFor(() => {
      expect(screen.getByText('Test Deck 1')).toBeInTheDocument()
      expect(screen.getByText(/2 due/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    // Start session
    const studyButton = screen.getByTestId('study-due-button')
    expect(studyButton).not.toBeDisabled()
    fireEvent.click(studyButton)

    // Wait for study session - use progress counter
    await waitFor(() => {
      expect(screen.getByText(/Card 1 of 2/i)).toBeInTheDocument()
    }, { timeout: 5000 })

    // Show answer
    fireEvent.click(screen.getByTestId('show-answer-button'))

    // Wait for review buttons
    await waitFor(() => {
      expect(screen.getByTestId('got-it-button')).toBeInTheDocument()
    })

    // Click Got It
    fireEvent.click(screen.getByTestId('got-it-button'))

    await waitFor(() => {
      expect(vi.mocked(reviewCard)).toHaveBeenCalledWith('card1', 'good')
    })
  })

  test('handles "Again" review correctly', async () => {
    vi.mocked(listDecks).mockResolvedValue([mockDeck1])
    vi.mocked(listCards).mockResolvedValue([mockCard1])
    vi.mocked(listDue).mockResolvedValue([mockCard1])
    vi.mocked(reviewCard).mockResolvedValue(undefined)

    render(
      <MemoryRouter>
        <Decks />
      </MemoryRouter>
    )

    // Wait for deck to be fully loaded
    await waitFor(() => {
      expect(screen.getByText('Test Deck 1')).toBeInTheDocument()
      expect(screen.getByText(/1 due/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    // Start session
    const studyButton = screen.getByTestId('study-due-button')
    expect(studyButton).not.toBeDisabled()
    fireEvent.click(studyButton)

    // Wait for study session - use progress counter
    await waitFor(() => {
      expect(screen.getByText(/Card 1 of 1/i)).toBeInTheDocument()
    }, { timeout: 5000 })

    // Show answer
    fireEvent.click(screen.getByTestId('show-answer-button'))

    // Wait for review buttons
    await waitFor(() => {
      expect(screen.getByTestId('again-button')).toBeInTheDocument()
    })

    // Click Again
    fireEvent.click(screen.getByTestId('again-button'))

    await waitFor(() => {
      expect(vi.mocked(reviewCard)).toHaveBeenCalledWith('card1', 'again')
    })
  })

  test('displays progress bar during study session', async () => {
    vi.mocked(listDecks).mockResolvedValue([mockDeck1])
    vi.mocked(listCards).mockResolvedValue([mockCard1, mockCard2])
    vi.mocked(listDue).mockResolvedValue([mockCard1, mockCard2])

    render(
      <MemoryRouter>
        <Decks />
      </MemoryRouter>
    )

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('study-due-button'))
    })

    await waitFor(() => {
      expect(screen.getByText(/50% Complete/i)).toBeInTheDocument()
    })
  })

  test('shows completion message when session is done', async () => {
    vi.mocked(listDecks).mockResolvedValue([mockDeck1])
    vi.mocked(listCards).mockResolvedValue([mockCard1])
    vi.mocked(listDue).mockResolvedValue([mockCard1])
    vi.mocked(reviewCard).mockResolvedValue(undefined)

    render(
      <MemoryRouter>
        <Decks />
      </MemoryRouter>
    )

    // Wait for deck to be loaded and stats to show
    await waitFor(() => {
      expect(screen.getByText('Test Deck 1')).toBeInTheDocument()
      expect(screen.getByText(/1 due/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    // Button should be enabled now
    const studyButton = screen.getByTestId('study-due-button')
    expect(studyButton).not.toBeDisabled()

    // Click Study Due button
    fireEvent.click(studyButton)

    // Wait for study session to start - look for progress counter (unique to session)
    await waitFor(() => {
      expect(screen.getByText(/Card 1 of 1/i)).toBeInTheDocument()
    }, { timeout: 5000 })

    // Now click show answer
    const showAnswerButton = screen.getByTestId('show-answer-button')
    fireEvent.click(showAnswerButton)

    // Wait for answer to appear
    await waitFor(() => {
      expect(screen.getByTestId('got-it-button')).toBeInTheDocument()
    })

    // Click "Got It" to finish the session
    const gotItButton = screen.getByTestId('got-it-button')
    fireEvent.click(gotItButton)

    // Should show completion message
    await waitFor(() => {
      expect(screen.getByText(/session complete/i)).toBeInTheDocument()
    })
  })

  test('displays Leitner box information', async () => {
    vi.mocked(listDecks).mockResolvedValue([mockDeck1])
    vi.mocked(listCards).mockResolvedValue([mockCard1])
    vi.mocked(listDue).mockResolvedValue([mockCard1])

    render(
      <MemoryRouter>
        <Decks />
      </MemoryRouter>
    )

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('study-due-button'))
    })

    await waitFor(() => {
      expect(screen.getByText(/Box 1/i)).toBeInTheDocument()
    })
  })

  test('shows empty state when no cards in deck', async () => {
    vi.mocked(listDecks).mockResolvedValue([mockDeck1])
    vi.mocked(listCards).mockResolvedValue([])
    vi.mocked(listDue).mockResolvedValue([])

    render(
      <MemoryRouter>
        <Decks />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/no cards yet/i)).toBeInTheDocument()
    })
  })

  test('disables study buttons when no cards available', async () => {
    vi.mocked(listDecks).mockResolvedValue([mockDeck1])
    vi.mocked(listCards).mockResolvedValue([])
    vi.mocked(listDue).mockResolvedValue([])

    render(
      <MemoryRouter>
        <Decks />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByTestId('study-due-button')).toBeDisabled()
      expect(screen.getByTestId('study-all-button')).toBeDisabled()
    })
  })

  test('displays due count badge', async () => {
    vi.mocked(listDecks).mockResolvedValue([mockDeck1])
    vi.mocked(listCards).mockResolvedValue([mockCard1, mockCard2])
    vi.mocked(listDue).mockResolvedValue([mockCard2])

    render(
      <MemoryRouter>
        <Decks />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/1 due/i)).toBeInTheDocument()
      expect(screen.getByText(/2 total/i)).toBeInTheDocument()
    })
  })

  test('handles API errors gracefully', async () => {
    vi.mocked(listDecks).mockRejectedValue(new Error('Failed to load decks'))

    render(
      <MemoryRouter>
        <Decks />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/failed to load decks/i)).toBeInTheDocument()
    })
  })

  test('clears input after creating deck', async () => {
    const newDeck = {
      _id: 'deck2',
      name: 'New Deck',
      createdAt: new Date().toISOString(),
    }

    vi.mocked(listDecks).mockResolvedValue([])
    vi.mocked(createDeck).mockResolvedValue(newDeck)
    vi.mocked(listCards).mockResolvedValue([])
    vi.mocked(listDue).mockResolvedValue([])

    render(
      <MemoryRouter>
        <Decks />
      </MemoryRouter>
    )

    const input = screen.getByPlaceholderText(/new deck name/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'New Deck' } })
    fireEvent.click(screen.getByText(/create deck/i))

    await waitFor(() => {
      expect(input.value).toBe('')
    })
  })
})