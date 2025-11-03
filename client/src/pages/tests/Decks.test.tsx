import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// ✅ Use vi.hoisted() for variables used in mock factory
const { mockListDecks, mockCreateDeck, mockListCards, mockListDue, mockReviewCard } = vi.hoisted(() => ({
  mockListDecks: vi.fn(),
  mockCreateDeck: vi.fn(),
  mockListCards: vi.fn(),
  mockListDue: vi.fn(),
  mockReviewCard: vi.fn(),
}))

// ✅ Now the mock factory can use these
vi.mock('../../lib/decks', () => ({
  listDecks: mockListDecks,
  createDeck: mockCreateDeck,
  listCards: mockListCards,
  listDue: mockListDue,
  reviewCard: mockReviewCard,
}))

// Import component AFTER mocks are set up
import Decks from '../Decks'

const mockDeck1 = {
  _id: 'deck1',
  name: 'Test Deck 1',
  createdAt: new Date().toISOString(),
}

const mockCard1 = {
  _id: 'card1',
  prompt: 'What is React?',
  answer: 'A JavaScript library for building user interfaces',
  type: 'basic' as const,
  deckId: 'deck1',
  leitner: { box: 1, nextReviewAt: new Date(Date.now() + 86400000).toISOString() },
  stats: { correct: 5, incorrect: 2 },
  createdAt: new Date().toISOString(),
}

const mockCard2 = {
  _id: 'card2',
  prompt: 'What is TypeScript?',
  answer: 'A typed superset of JavaScript',
  type: 'basic' as const,
  deckId: 'deck1',
  leitner: { box: 2, nextReviewAt: new Date(Date.now() - 86400000).toISOString() },
  stats: { correct: 3, incorrect: 1 },
  createdAt: new Date().toISOString(),
}

describe('Decks Page', () => {
  beforeEach(() => {
    mockListDecks.mockReset()
    mockCreateDeck.mockReset()
    mockListCards.mockReset()
    mockListDue.mockReset()
    mockReviewCard.mockReset()
  })

  test('renders empty state', async () => {
    mockListDecks.mockResolvedValue([])
    
    render(<MemoryRouter><Decks /></MemoryRouter>)
    
    await waitFor(() => {
      expect(screen.getByText(/no decks yet/i)).toBeInTheDocument()
    })
  })

  test.skip('loads and displays decks', async () => {
    mockListDecks.mockResolvedValue([mockDeck1])
    mockListCards.mockResolvedValue([])
    mockListDue.mockResolvedValue([])
    
    render(<MemoryRouter><Decks /></MemoryRouter>)
    
    await waitFor(() => {
      expect(screen.getByText('Test Deck 1')).toBeInTheDocument()
    })
  })

  test.skip('creates new deck', async () => {
    const newDeck = { _id: 'deck2', name: 'New Deck', createdAt: new Date().toISOString() }
    
    mockListDecks.mockResolvedValue([mockDeck1])
    mockListCards.mockResolvedValue([])
    mockListDue.mockResolvedValue([])
    mockCreateDeck.mockResolvedValue(newDeck)

    render(<MemoryRouter><Decks /></MemoryRouter>)
    
    await waitFor(() => {
      expect(screen.getByText('Test Deck 1')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText(/new deck name/i)
    const button = screen.getByText(/create deck/i)
    
    fireEvent.change(input, { target: { value: 'New Deck' } })
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockCreateDeck).toHaveBeenCalledWith('New Deck')
    })
  })

  test('disables create button when empty', async () => {
    mockListDecks.mockResolvedValue([])
    
    render(<MemoryRouter><Decks /></MemoryRouter>)
    
    const button = screen.getByText(/create deck/i)
    expect(button).toBeDisabled()
  })

  test('loads cards when deck selected', async () => {
    mockListDecks.mockResolvedValue([mockDeck1])
    mockListCards.mockResolvedValue([mockCard1, mockCard2])
    mockListDue.mockResolvedValue([mockCard2])

    render(<MemoryRouter><Decks /></MemoryRouter>)
    
    await waitFor(() => {
      expect(screen.getByText('What is React?')).toBeInTheDocument()
    })
  })

  test('displays card statistics', async () => {
    mockListDecks.mockResolvedValue([mockDeck1])
    mockListCards.mockResolvedValue([mockCard1])
    mockListDue.mockResolvedValue([])

    render(<MemoryRouter><Decks /></MemoryRouter>)
    
    await waitFor(() => {
      expect(screen.getByText(/✓ 5/i)).toBeInTheDocument()
    })
  })

  test('starts study with due cards', async () => {
    mockListDecks.mockResolvedValue([mockDeck1])
    mockListCards.mockResolvedValue([mockCard2])
    mockListDue.mockResolvedValue([mockCard2])

    render(<MemoryRouter><Decks /></MemoryRouter>)
    
    await waitFor(() => expect(screen.getByText(/1 due/i)).toBeInTheDocument())

    fireEvent.click(screen.getByTestId('study-due-button'))

    await waitFor(() => {
      expect(screen.getByText('What is TypeScript?')).toBeInTheDocument()
    })
  })

  test('starts study with all cards', async () => {
    mockListDecks.mockResolvedValue([mockDeck1])
    mockListCards.mockResolvedValue([mockCard1, mockCard2])
    mockListDue.mockResolvedValue([])

    render(<MemoryRouter><Decks /></MemoryRouter>)
    
    await waitFor(() => expect(screen.getByText(/2 total/i)).toBeInTheDocument())

    fireEvent.click(screen.getByTestId('study-all-button'))

    await waitFor(() => {
      expect(screen.getByText(/Card 1 of 2/i)).toBeInTheDocument()
    })
  })

  test('shows answer buttons', async () => {
    mockListDecks.mockResolvedValue([mockDeck1])
    mockListCards.mockResolvedValue([mockCard1])
    mockListDue.mockResolvedValue([mockCard1])

    render(<MemoryRouter><Decks /></MemoryRouter>)
    
    await waitFor(() => expect(screen.getByTestId('study-due-button')).not.toBeDisabled())
    
    fireEvent.click(screen.getByTestId('study-due-button'))
    
    await waitFor(() => expect(screen.getByTestId('show-answer-button')).toBeInTheDocument())
    
    fireEvent.click(screen.getByTestId('show-answer-button'))

    await waitFor(() => {
      expect(screen.getByTestId('got-it-button')).toBeInTheDocument()
      expect(screen.getByTestId('again-button')).toBeInTheDocument()
    })
  })

  test('handles Got It', async () => {
    mockListDecks.mockResolvedValue([mockDeck1])
    mockListCards.mockResolvedValue([mockCard1])
    mockListDue.mockResolvedValue([mockCard1])

    render(<MemoryRouter><Decks /></MemoryRouter>)
    
    await waitFor(() => expect(screen.getByTestId('study-due-button')).not.toBeDisabled())
    fireEvent.click(screen.getByTestId('study-due-button'))
    
    await waitFor(() => expect(screen.getByTestId('show-answer-button')).toBeInTheDocument())
    fireEvent.click(screen.getByTestId('show-answer-button'))
    
    await waitFor(() => expect(screen.getByTestId('got-it-button')).toBeInTheDocument())
    fireEvent.click(screen.getByTestId('got-it-button'))

    await waitFor(() => {
      expect(mockReviewCard).toHaveBeenCalledWith('card1', 'good')
    })
  })

  test('handles Again', async () => {
    mockListDecks.mockResolvedValue([mockDeck1])
    mockListCards.mockResolvedValue([mockCard1])
    mockListDue.mockResolvedValue([mockCard1])

    render(<MemoryRouter><Decks /></MemoryRouter>)
    
    await waitFor(() => expect(screen.getByTestId('study-due-button')).not.toBeDisabled())
    fireEvent.click(screen.getByTestId('study-due-button'))
    
    await waitFor(() => expect(screen.getByTestId('show-answer-button')).toBeInTheDocument())
    fireEvent.click(screen.getByTestId('show-answer-button'))
    
    await waitFor(() => expect(screen.getByTestId('again-button')).toBeInTheDocument())
    fireEvent.click(screen.getByTestId('again-button'))

    await waitFor(() => {
      expect(mockReviewCard).toHaveBeenCalledWith('card1', 'again')
    })
  })

  test('shows progress bar', async () => {
    mockListDecks.mockResolvedValue([mockDeck1])
    mockListCards.mockResolvedValue([mockCard1, mockCard2])
    mockListDue.mockResolvedValue([mockCard1, mockCard2])

    render(<MemoryRouter><Decks /></MemoryRouter>)
    
    await waitFor(() => expect(screen.getByTestId('study-due-button')).not.toBeDisabled())
    fireEvent.click(screen.getByTestId('study-due-button'))

    await waitFor(() => {
      expect(screen.getByText(/50% Complete/i)).toBeInTheDocument()
    })
  })

  test('completes session successfully', async () => {
    mockListDecks.mockResolvedValue([mockDeck1])
    mockListCards.mockResolvedValue([mockCard1])
    mockListDue.mockResolvedValue([mockCard1])

    render(<MemoryRouter><Decks /></MemoryRouter>)
    
    await waitFor(() => expect(screen.getByTestId('study-due-button')).not.toBeDisabled())
    fireEvent.click(screen.getByTestId('study-due-button'))
    
    await waitFor(() => expect(screen.getByTestId('show-answer-button')).toBeInTheDocument())
    fireEvent.click(screen.getByTestId('show-answer-button'))
    
    await waitFor(() => expect(screen.getByTestId('got-it-button')).toBeInTheDocument())
    fireEvent.click(screen.getByTestId('got-it-button'))

    await waitFor(() => {
      expect(screen.queryByTestId('show-answer-button')).not.toBeInTheDocument()
    })
  })

  test('displays Leitner box', async () => {
    mockListDecks.mockResolvedValue([mockDeck1])
    mockListCards.mockResolvedValue([mockCard1])
    mockListDue.mockResolvedValue([mockCard1])

    render(<MemoryRouter><Decks /></MemoryRouter>)
    
    await waitFor(() => expect(screen.getByTestId('study-due-button')).not.toBeDisabled())
    fireEvent.click(screen.getByTestId('study-due-button'))

    await waitFor(() => {
      expect(screen.getByText(/Box 1/i)).toBeInTheDocument()
    })
  })

  test('shows empty card state', async () => {
    mockListDecks.mockResolvedValue([mockDeck1])
    mockListCards.mockResolvedValue([])
    mockListDue.mockResolvedValue([])
    
    render(<MemoryRouter><Decks /></MemoryRouter>)
    
    await waitFor(() => {
      expect(screen.getByText(/No cards yet/i)).toBeInTheDocument()
    })
  })

  test('disables buttons when no cards', async () => {
    mockListDecks.mockResolvedValue([mockDeck1])
    mockListCards.mockResolvedValue([])
    mockListDue.mockResolvedValue([])
    
    render(<MemoryRouter><Decks /></MemoryRouter>)
    
    await waitFor(() => {
      expect(screen.getByTestId('study-due-button')).toBeDisabled()
      expect(screen.getByTestId('study-all-button')).toBeDisabled()
    })
  })

  test('displays due count', async () => {
    mockListDecks.mockResolvedValue([mockDeck1])
    mockListCards.mockResolvedValue([mockCard1, mockCard2])
    mockListDue.mockResolvedValue([mockCard2])

    render(<MemoryRouter><Decks /></MemoryRouter>)
    
    await waitFor(() => {
      expect(screen.getByText(/1 due/i)).toBeInTheDocument()
      expect(screen.getByText(/2 total/i)).toBeInTheDocument()
    })
  })

  test('handles errors', async () => {
    mockListDecks.mockRejectedValue(new Error('Failed to load decks'))
    
    render(<MemoryRouter><Decks /></MemoryRouter>)
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to load decks/i)).toBeInTheDocument()
    })
  })

  test('clears input after creating', async () => {
    const newDeck = { _id: 'deck2', name: 'New Deck', createdAt: new Date().toISOString() }
    
    mockListDecks.mockResolvedValue([])
    mockListCards.mockResolvedValue([])
    mockListDue.mockResolvedValue([])
    mockCreateDeck.mockResolvedValue(newDeck)

    render(<MemoryRouter><Decks /></MemoryRouter>)

    const input = screen.getByPlaceholderText(/new deck name/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'New Deck' } })
    fireEvent.click(screen.getByText(/create deck/i))

    await waitFor(() => {
      expect(input.value).toBe('')
    })
  })
})