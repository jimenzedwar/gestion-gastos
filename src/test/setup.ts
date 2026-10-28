import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// AppContext polls a public BCV-rate API on mount — never let tests hit the
// real network; the code already treats a failed fetch as "offline, keep
// the last known rate" and degrades gracefully.
global.fetch = vi.fn(() => Promise.reject(new Error('network disabled in tests'))) as unknown as typeof fetch;
