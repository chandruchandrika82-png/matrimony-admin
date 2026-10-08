import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import App from './App';
import api from './services/api';
import { memberGroups } from './components/MemberFields';

jest.mock('./services/api', () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() }, API_URL: 'https://example.com/api' }));
beforeAll(() => { HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); }; });
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

test('overview has no back button and Tamil language persists across navigation', async () => {
  localStorage.setItem('adminToken', 'test-session'); api.get.mockResolvedValue({ data: [] });
  render(<App />);
  expect(screen.queryByRole('button', { name: 'Go back' })).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole('combobox', { name: 'Language' }), { target: { value: 'ta' } });
  expect(screen.getByRole('heading', { name: 'கண்ணோட்டம்' })).toBeInTheDocument();
  expect(localStorage.getItem('adminLanguage')).toBe('ta');
  fireEvent.click(screen.getByRole('link', { name: 'உறுப்பினர்கள்' }));
  expect(screen.getByRole('button', { name: 'பின்செல்' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'உறுப்பினரைச் சேர்' })).toBeInTheDocument();
  await screen.findByText('உறுப்பினர்கள் இல்லை.');
});

test('adds a member and displays server errors without closing the form', async () => {
  localStorage.setItem('adminToken', 'test-session'); window.history.replaceState({}, '', '/members');
  api.get.mockResolvedValue({ data: [] }); api.post.mockRejectedValueOnce({ response: { data: { error: 'This email address is already registered' } } }).mockResolvedValueOnce({ data: {} });
  render(<App />); await screen.findByText('No members found.');
  fireEvent.click(screen.getByRole('button', { name: 'Add member' }));
  const dialog = within(screen.getByRole('dialog'));
  fireEvent.change(dialog.getByLabelText('Name'), { target: { value: 'New Member' } });
  fireEvent.change(dialog.getByLabelText('Email'), { target: { value: 'new@example.com' } });
  fireEvent.change(dialog.getByLabelText('Password'), { target: { value: 'test-password' } });
  fireEvent.click(dialog.getByRole('button', { name: 'Save member' }));
  expect(await dialog.findByRole('alert')).toHaveTextContent('already registered');
  fireEvent.click(dialog.getByRole('button', { name: 'Save member' }));
  await screen.findByText('Member added.');
  expect(api.post).toHaveBeenLastCalledWith('/admin/members', expect.objectContaining({ name: 'New Member', email: 'new@example.com', password: 'test-password', isPremium: false }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('edits members without sending saved profiles and requires confirmation before deleting', async () => {
  localStorage.setItem('adminToken', 'test-session'); window.history.replaceState({}, '', '/members');
  api.get.mockResolvedValue({ data: [{ _id: '1', name: 'Anu', email: 'anu@example.com', favoriteProfiles: ['2'], role: 'user' }] });
  api.put.mockResolvedValue({ data: {} }); api.delete.mockResolvedValue({ data: {} });
  render(<App />); await screen.findByText('Anu');
  fireEvent.click(screen.getByRole('button', { name: 'Edit member Anu' }));
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Anu Updated' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save member' }));
  await screen.findByText('Member updated.');
  expect(api.put.mock.calls[0][1]).not.toHaveProperty('favoriteProfiles');
  expect(api.put.mock.calls[0][1]).not.toHaveProperty('role');
  fireEvent.click(screen.getByRole('button', { name: 'Delete member Anu' }));
  expect(api.delete).not.toHaveBeenCalled();
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));
  expect(api.delete).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Delete member Anu' }));
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete member' }));
  await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/admin/members/1'));
  await screen.findByText('Member deleted.');
});

test('settings omits backend connection without altering the application connection', async () => {
  localStorage.setItem('adminToken', 'test-session'); window.history.replaceState({}, '', '/settings'); api.get.mockResolvedValue({ data: [] });
  render(<App />);
  expect(screen.queryByText('Backend connection')).not.toBeInTheDocument();
  expect(screen.queryByLabelText('API endpoint')).not.toBeInTheDocument();
  expect(screen.queryByDisplayValue('https://example.com/api')).not.toBeInTheDocument();
  await waitFor(() => expect(api.get).toHaveBeenCalledWith('/users'));
});

test('complete member details and uploaded documents are submitted together', async () => {
  localStorage.setItem('adminToken', 'test-session'); window.history.replaceState({}, '', '/members');
  api.get.mockResolvedValue({ data: [] }); api.post.mockResolvedValue({ data: {} });
  render(<App />); await screen.findByText('No members found.');
  fireEvent.click(screen.getByRole('button', { name: 'Add member' }));
  expect(screen.queryByLabelText('Job category')).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole('combobox', { name: 'Occupation', exact: true }), { target: { value: 'Job' } });
  const labels = Array.from(screen.getByRole('dialog').querySelectorAll('label'));
  for (const [, fields] of memberGroups) for (const [, label] of fields) expect(labels.some(element => element.textContent.trim().startsWith(label) && element.querySelector('input, select, textarea'))).toBe(true);
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Full Member' } });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'full@example.com' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'test-password' } });
  fireEvent.change(screen.getByLabelText('Business type'), { target: { value: 'Retail' } });
  fireEvent.change(screen.getByLabelText('Father occupation'), { target: { value: 'Farmer' } });
  fireEvent.change(screen.getByLabelText('Job category'), { target: { value: 'Engineering' } });
  fireEvent.change(screen.getByLabelText('Job location'), { target: { value: 'Chennai' } });
  fireEvent.change(screen.getByLabelText('Experience (years)'), { target: { value: '3' } });
  fireEvent.change(screen.getByLabelText('Preferred age from'), { target: { value: '22' } });
  fireEvent.click(screen.getByLabelText('Hide mobile'));
  fireEvent.change(screen.getByLabelText('Horoscope file'), { target: { files: [new File(['fixture'], 'horoscope.pdf', { type: 'application/pdf' })] } });
  fireEvent.click(screen.getByRole('button', { name: 'Save member' }));
  await screen.findByText('Member added.');
  const submitted = api.post.mock.calls[0][1];
  expect(submitted).toBeInstanceOf(FormData);
  expect(submitted.get('businessType')).toBe('Retail'); expect(submitted.get('fatherOccupation')).toBe('Farmer'); expect(submitted.get('preferredAgeFrom')).toBe('22'); expect(submitted.get('hideMobile')).toBe('true'); expect(submitted.get('horoscopeFile').name).toBe('horoscope.pdf');
  expect(submitted.get('occupationType')).toBe('Job'); expect(submitted.get('jobCategory')).toBe('Engineering'); expect(submitted.get('jobLocation')).toBe('Chennai'); expect(submitted.get('jobExperience')).toBe('3');
});
