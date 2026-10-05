import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';
import api from './services/api';

jest.mock('./services/api', () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn() }, API_URL: 'https://example.com/api' }));
beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, '', '/');
  jest.clearAllMocks();
});
test('requires login before displaying the administration workspace', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
  expect(api.get).not.toHaveBeenCalled();
});
test('loads members, filters the directory and isolates premium profiles', async () => {
  localStorage.setItem('adminToken', 'test-session');
  api.get.mockResolvedValue({ data: [
    { _id: '1', name: 'Anu', email: 'anu@example.com', gender: 'Female', district: 'Kochi', isPremium: true },
    { _id: '2', name: 'Rahul', email: 'rahul@example.com', gender: 'Male', district: 'Kollam', isPremium: false }
  ] });
  render(<App />);
  await screen.findByText('Anu');
  fireEvent.click(screen.getByRole('link', { name: 'Members' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Search members' }), { target: { value: 'Kollam' } });
  expect(screen.getByText('Rahul')).toBeInTheDocument();
  expect(screen.queryByText('Anu')).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole('textbox', { name: 'Search members' }), { target: { value: '' } });
  fireEvent.click(screen.getByRole('link', { name: 'Premium' }));
  expect(screen.getByText('Anu')).toBeInTheDocument();
  expect(screen.queryByText('Rahul')).not.toBeInTheDocument();
});
test('shows failed data requests and allows retry', async () => {
  localStorage.setItem('adminToken', 'test-session');
  api.get.mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce({ data: [] });
  render(<App />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load members');
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  await screen.findByText('No members found.');
  expect(api.get).toHaveBeenCalledTimes(2);
});
