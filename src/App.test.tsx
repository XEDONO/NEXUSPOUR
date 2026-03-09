import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders without crashing', async () => {
  render(<App />);
  expect(await screen.findByRole('heading', { name: /NexusPour/i })).toBeInTheDocument();
});
