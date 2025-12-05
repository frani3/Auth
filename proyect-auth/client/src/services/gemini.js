import api from './api'

export async function askGemini(prompt) {
  const response = await api.post('/gemini', { prompt })
  return response.data
}
