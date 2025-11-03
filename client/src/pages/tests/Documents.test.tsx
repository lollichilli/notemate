import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// ✅ Use vi.hoisted() for mock functions
const {
  mockListDocuments,
  mockCreateDocument,
  mockParseMarkdown,
  mockListBlocks,
  mockGetDocument,
  mockUploadPdfAndParse,
  mockListDecks,
  mockCreateCard,
  mockGenerateFlashcards,
  mockGenerateQuiz,
  mockCreateQuiz,
} = vi.hoisted(() => ({
  mockListDocuments: vi.fn(),
  mockCreateDocument: vi.fn(),
  mockParseMarkdown: vi.fn(),
  mockListBlocks: vi.fn(),
  mockGetDocument: vi.fn(),
  mockUploadPdfAndParse: vi.fn(),
  mockListDecks: vi.fn(),
  mockCreateCard: vi.fn(),
  mockGenerateFlashcards: vi.fn(),
  mockGenerateQuiz: vi.fn(),
  mockCreateQuiz: vi.fn(),
}))

// ✅ Mock all required modules
vi.mock('../../lib/documents', () => ({
  listDocuments: mockListDocuments,
  createDocument: mockCreateDocument,
  parseMarkdown: mockParseMarkdown,
  listBlocks: mockListBlocks,
  getDocument: mockGetDocument,
  uploadPdfAndParse: mockUploadPdfAndParse,
}))

vi.mock('../../lib/decks', () => ({
  listDecks: mockListDecks,
  createCard: mockCreateCard,
}))

vi.mock('../../lib/flashcards', () => ({
  generateFlashcardsFromDocument: mockGenerateFlashcards,
}))

vi.mock('../../lib/quizzes', () => ({
  generateQuizFromDocument: mockGenerateQuiz,
  createQuiz: mockCreateQuiz,
}))

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    token: 'fake-token',
    user: { id: 'user1', email: 'test@example.com' },
  }),
}))

import Documents from '../Documents'

const mockDoc1 = {
  _id: 'doc1',
  title: 'Test Document 1',
  createdAt: new Date().toISOString(),
}

const mockBlock1 = {
  _id: 'block1',
  documentId: 'doc1',
  page: 1,
  blockIndex: 0,
  type: 'heading' as const,
  text: 'Introduction to React',
}

const mockDeck1 = {
  _id: 'deck1',
  name: 'Test Deck',
  createdAt: new Date().toISOString(),
}

describe('Documents Page', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Mock localStorage
    global.localStorage.setItem('token', 'fake-token')
  })

  test('renders empty state when no documents', async () => {
    mockListDocuments.mockResolvedValue([])
    mockListDecks.mockResolvedValue([])

    render(
      <MemoryRouter>
        <Documents />
      </MemoryRouter>
    )

    expect(await screen.findByText(/no documents yet/i)).toBeInTheDocument()
  })

  test('disables create button when title is empty', async () => {
    mockListDocuments.mockResolvedValue([])
    mockListDecks.mockResolvedValue([])

    render(
      <MemoryRouter>
        <Documents />
      </MemoryRouter>
    )

    const button = screen.getByText(/create document/i)
    expect(button).toBeDisabled()
  })

  test('shows empty blocks state', async () => {
    mockListDocuments.mockResolvedValue([mockDoc1])
    mockListDecks.mockResolvedValue([])
    mockGetDocument.mockResolvedValue({ ...mockDoc1, source: { rawText: '' } })
    mockListBlocks.mockResolvedValue([])

    render(
      <MemoryRouter>
        <Documents />
      </MemoryRouter>
    )

    expect(await screen.findByText(/no blocks yet/i)).toBeInTheDocument()
  })

  test('shows deck selector when decks exist', async () => {
    mockListDocuments.mockResolvedValue([mockDoc1])
    mockListDecks.mockResolvedValue([mockDeck1])
    mockGetDocument.mockResolvedValue({ ...mockDoc1, source: { rawText: '' } })
    mockListBlocks.mockResolvedValue([])

    render(
      <MemoryRouter>
        <Documents />
      </MemoryRouter>
    )

    expect(await screen.findByText(/add cards to deck/i)).toBeInTheDocument()
  })

  test('shows no decks warning when no decks exist', async () => {
    mockListDocuments.mockResolvedValue([mockDoc1])
    mockListDecks.mockResolvedValue([])
    mockGetDocument.mockResolvedValue({ ...mockDoc1, source: { rawText: '' } })
    mockListBlocks.mockResolvedValue([])

    render(
      <MemoryRouter>
        <Documents />
      </MemoryRouter>
    )

    expect(await screen.findByText(/no decks yet/i)).toBeInTheDocument()
  })

  test('disables flashcard button when no decks', async () => {
    mockListDocuments.mockResolvedValue([mockDoc1])
    mockListDecks.mockResolvedValue([])
    mockGetDocument.mockResolvedValue({ ...mockDoc1, source: { rawText: '' } })
    mockListBlocks.mockResolvedValue([mockBlock1])

    render(
      <MemoryRouter>
        <Documents />
      </MemoryRouter>
    )

    const addButton = await screen.findByText(/\+ flashcard/i)
    expect(addButton).toBeDisabled()
  })

  test('handles document creation error', async () => {
    mockListDocuments.mockResolvedValue([])
    mockListDecks.mockResolvedValue([])
    mockCreateDocument.mockRejectedValue(new Error('Failed to create document'))

    render(
      <MemoryRouter>
        <Documents />
      </MemoryRouter>
    )

    const input = screen.getByPlaceholderText(/new document title/i)
    const button = screen.getByText(/create document/i)

    fireEvent.change(input, { target: { value: 'New Document' } })
    fireEvent.click(button)

    expect(await screen.findByText(/failed to create document/i)).toBeInTheDocument()
  })

  test.skip('disables parse button when no markdown', async () => {
    mockListDocuments.mockResolvedValue([mockDoc1])
    mockListDecks.mockResolvedValue([])
    mockGetDocument.mockResolvedValue({ ...mockDoc1, source: { rawText: '' } })
    mockListBlocks.mockResolvedValue([])

    render(
      <MemoryRouter>
        <Documents />
      </MemoryRouter>
    )

    // Wait for document to load
    await screen.findByText('Test Document 1')

    const parseButton = screen.getByText(/parse markdown/i)
    expect(parseButton).toBeDisabled()
  })

  test('disables parse button when no document selected', async () => {
    mockListDocuments.mockResolvedValue([])
    mockListDecks.mockResolvedValue([])

    render(
      <MemoryRouter>
        <Documents />
      </MemoryRouter>
    )

    const parseButton = screen.getByText(/parse markdown/i)
    expect(parseButton).toBeDisabled()
  })

  test('displays parsed blocks', async () => {
    mockListDocuments.mockResolvedValue([mockDoc1])
    mockListDecks.mockResolvedValue([mockDeck1])
    mockGetDocument.mockResolvedValue({ ...mockDoc1, source: { rawText: '' } })
    mockListBlocks.mockResolvedValue([mockBlock1])

    render(
      <MemoryRouter>
        <Documents />
      </MemoryRouter>
    )

    expect(await screen.findByText('Introduction to React')).toBeInTheDocument()
  })

  test('opens card editor when clicking add flashcard', async () => {
    mockListDocuments.mockResolvedValue([mockDoc1])
    mockListDecks.mockResolvedValue([mockDeck1])
    mockGetDocument.mockResolvedValue({ ...mockDoc1, source: { rawText: '' } })
    mockListBlocks.mockResolvedValue([mockBlock1])

    render(
      <MemoryRouter>
        <Documents />
      </MemoryRouter>
    )

    // Wait for block and click add flashcard
    await screen.findByText('Introduction to React')
    
    const addButton = screen.getByText(/\+ flashcard/i)
    fireEvent.click(addButton)

    // Check editor appeared
    expect(await screen.findByPlaceholderText(/front of card/i)).toBeInTheDocument()
    expect(await screen.findByPlaceholderText(/back of card/i)).toBeInTheDocument()
  })

  test('cancels card creation', async () => {
    mockListDocuments.mockResolvedValue([mockDoc1])
    mockListDecks.mockResolvedValue([mockDeck1])
    mockGetDocument.mockResolvedValue({ ...mockDoc1, source: { rawText: '' } })
    mockListBlocks.mockResolvedValue([mockBlock1])

    render(
      <MemoryRouter>
        <Documents />
      </MemoryRouter>
    )

    // Open editor
    await screen.findByText('Introduction to React')
    fireEvent.click(screen.getByText(/\+ flashcard/i))
    await screen.findByPlaceholderText(/front of card/i)

    // Cancel
    fireEvent.click(screen.getByText(/cancel/i))

    // Editor should be gone
    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/front of card/i)).not.toBeInTheDocument()
    })
  })

  test.skip('creates new document', async () => {
    const newDoc = { _id: 'doc3', title: 'New Document', createdAt: new Date().toISOString() }

    mockListDocuments.mockResolvedValue([mockDoc1])
    mockListDecks.mockResolvedValue([])
    mockGetDocument.mockResolvedValue({ ...mockDoc1, source: { rawText: '' } })
    mockListBlocks.mockResolvedValue([])
    mockCreateDocument.mockResolvedValue(newDoc)

    render(
      <MemoryRouter>
        <Documents />
      </MemoryRouter>
    )

    // Wait for initial load
    await screen.findByText('Test Document 1')

    // Create new document
    const input = screen.getByPlaceholderText(/new document title/i)
    fireEvent.change(input, { target: { value: 'New Document' } })
    
    // Mock for new doc
    mockGetDocument.mockResolvedValue({ ...newDoc, source: { rawText: '' } })
    
    fireEvent.click(screen.getByText(/create document/i))

    await waitFor(() => {
      expect(mockCreateDocument).toHaveBeenCalledWith('New Document')
    })
  })
})