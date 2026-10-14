export const API_URL = import.meta.env?.VITE_API_URL || 'https://dummyjson.com';

export async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, signal: options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000) });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Unable to reach the server. Check your connection and try again.');
  }
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'The request failed. Please try again.');
    error.status = response.status;
    throw error;
  }
  return data;
}
