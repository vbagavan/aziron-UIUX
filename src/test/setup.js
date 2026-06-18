import '@testing-library/jest-dom';

// Minimal localStorage mock for jsdom
const store = {};
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  },
  writable: true,
});

// Silence React 19 act() warnings in test output
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
