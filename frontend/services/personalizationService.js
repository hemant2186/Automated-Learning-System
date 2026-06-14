import API from '../lib/api';

export async function fetchPersonalization() {
  const response = await API.get('/api/personalization');
  return response.data;
}
