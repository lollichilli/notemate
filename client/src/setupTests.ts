import { vi, expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// ✅ This was missing! Extends expect with .toBeInTheDocument()
expect.extend(matchers)

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn((key: string) => key === 'token' ? 'fake-test-token' : null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}

global.localStorage = localStorageMock as any