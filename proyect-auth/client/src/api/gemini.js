const apiKey = ''
const MODEL_NAME = 'gemini-2.5-flash-preview-09-2025'

export const callGeminiAPI = async (prompt, systemInstruction = '') => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                type: { type: 'STRING', enum: ['recommendation', 'event_creation', 'general', 'academic_analysis', 'concept_list'] },
                message: { type: 'STRING' },
                analysis_summary: { type: 'STRING' },
                key_concepts: { type: 'ARRAY', items: { type: 'STRING' } },
                event_details: {
                  type: 'OBJECT',
                  properties: {
                    title: { type: 'STRING' },
                    time: { type: 'STRING' },
                    room: { type: 'STRING' },
                    description: { type: 'STRING' }
                  }
                },
                action_route: { type: 'STRING' }
              }
            }
          }
        })
      }
    )

    if (!response.ok) throw new Error(`API Error: ${response.status}`)
    const data = await response.json()
    return JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || '{}')
  } catch (error) {
    console.error('Gemini API Error:', error)
    return { type: 'general', message: 'Error de conexión. Intenta nuevamente.' }
  }
}
