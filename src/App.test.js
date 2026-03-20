import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the public landing page hero', () => {
  render(<App />);
  expect(
    screen.getByRole('heading', { name: /Find Government Programs You May Qualify For in Bulacan/i })
  ).toBeInTheDocument();
});
