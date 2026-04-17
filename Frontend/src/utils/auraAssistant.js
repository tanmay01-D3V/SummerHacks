const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

const SYSTEM_PROMPT = `
You are Aura Voice Support, a calm and supportive wellness copilot.
Primary goal: help users with stress, mood, fatigue, hydration, sleep rhythm, physical tension, and healthy routine adjustments.

Rules:
1) Be empathetic, concise, and practical.
2) Use the provided user context (stress index, sleep/work balance, habits, focus, and app state).
3) Give low-risk, non-diagnostic suggestions grounded in daily routines.
4) Never claim to diagnose or replace medical professionals.
5) If user describes emergency symptoms, self-harm, suicidal intent, severe injury, chest pain, trouble breathing, or immediate danger:
   - respond with urgent guidance to contact local emergency services right now,
   - suggest reaching a trusted person immediately.
6) Always include:
   - one immediate action (1-5 minutes),
   - one next-hour action,
   - one today-level action.
`.trim()

export const buildWellnessContext = (activeTab) => ({
  appSection: activeTab,
  stressIndex: 64,
  restingHeartRate: 72,
  oxygenLevel: 98,
  focusHours: 4.2,
  hydrationStatus: 'below target',
  sleepPattern: 'sleep-to-work ratio indicates elevated anxiety risk by Thursday',
  habits: ['10-minute walk at 3 PM', 'blue-light filter at 8 PM', 'hourly hydration checks'],
})

export const getAssistantReply = async ({ message, context }) => {
  const apiKey = import.meta.env.VITE_AURA_AI_API_KEY
  const provider = (import.meta.env.VITE_AURA_AI_PROVIDER || 'gemini').toLowerCase()
  const apiUrl = import.meta.env.VITE_AURA_AI_API_URL
  const model = import.meta.env.VITE_AURA_AI_MODEL || (provider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini')
  const userPrompt = `User wellness context:\n${JSON.stringify(context, null, 2)}\n\nUser says:\n${message}`

  if (!apiKey) {
    throw new Error('Missing VITE_AURA_AI_API_KEY. Add it to your .env.local file.')
  }

  const isGemini = provider === 'gemini'
  const response = await fetch(apiUrl || (isGemini ? GEMINI_API_URL : OPENAI_API_URL), {
    method: 'POST',
    headers: isGemini
      ? {
          'Content-Type': 'application/json',
          'X-goog-api-key': apiKey,
        }
      : {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
    body: JSON.stringify(
      isGemini
        ? {
            contents: [{ parts: [{ text: userPrompt }] }],
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            generationConfig: {
              temperature: 0.5,
            },
          }
        : {
            model,
            temperature: 0.5,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: userPrompt },
            ],
          },
    ),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Assistant API error (${response.status}): ${errorText}`)
  }

  const data = await response.json()
  const content = isGemini
    ? data?.candidates?.[0]?.content?.parts?.map((part) => part?.text || '').join('\n').trim()
    : data?.choices?.[0]?.message?.content

  if (!content) {
    throw new Error('Assistant API returned an empty response.')
  }

  return content
}
