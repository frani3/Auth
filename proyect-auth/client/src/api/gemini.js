const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ''
const MODEL_NAME = 'gemini-2.0-flash'

// Función helper para esperar
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

export const callGeminiAPI = async (prompt, systemInstruction = '', retries = 2) => {
  const requestBody = {
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
              date: { type: 'STRING' },
              ubicacion_id: { type: 'STRING' },
              description: { type: 'STRING' }
            }
          },
          action_route: { type: 'STRING' }
        }
      }
    }
  }

  // Log del request
  console.log('🚀 === GEMINI API REQUEST ===')
  console.log('📍 URL:', `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`)
  console.log('🔑 API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NO API KEY!')
  console.log('💬 Prompt:', prompt)
  console.log('📋 System Instruction:', systemInstruction.substring(0, 200) + '...')
  console.log('📦 Full Request Body:', JSON.stringify(requestBody, null, 2))

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      }
    )

    console.log('📥 Response Status:', response.status, response.statusText)

    // Manejar error 429 (Too Many Requests) con retry
    if (response.status === 429) {
      console.warn('⚠️ Rate limit (429) alcanzado')
      if (retries > 0) {
        console.warn(`🔄 Reintentando en 3 segundos... (${retries} intentos restantes)`)
        await sleep(3000)
        return callGeminiAPI(prompt, systemInstruction, retries - 1)
      }
      return { 
        type: 'general', 
        message: '⚠️ El servicio está muy ocupado. Por favor espera unos segundos e intenta de nuevo.' 
      }
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ API Error Response:', errorText)
      throw new Error(`API Error: ${response.status}`)
    }

    const data = await response.json()
    console.log('✅ Response Data:', JSON.stringify(data, null, 2))
    
    const parsedResult = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || '{}')
    console.log('🎯 Parsed Result:', parsedResult)
    
    return parsedResult
  } catch (error) {
    console.error('❌ Gemini API Error:', error)
    return { type: 'general', message: 'Error de conexión. Intenta nuevamente.' }
  }
}
