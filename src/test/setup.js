// Vitest setup: adds jest-dom matchers (toBeInTheDocument, etc.) and clears
// localStorage between tests so cached scores don't leak across cases.
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  localStorage.clear();
});
