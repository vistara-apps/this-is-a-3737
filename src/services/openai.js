import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY || 'your-openai-api-key-here',
  baseURL: "https://openrouter.ai/api/v1",
  dangerouslyAllowBrowser: true,
})

export const generateLegalGuide = async (state, category) => {
  try {
    const prompt = `Create a comprehensive but concise legal guide for ${category} in ${state}. 
    
    Include:
    - Key rights citizens have
    - What law enforcement can and cannot do
    - Step-by-step advice for the situation
    - Important ${state}-specific laws or procedures
    - When to contact a lawyer
    
    Keep it practical, easy to understand, and actionable. Format as plain text with clear sections.
    Focus on protection of constitutional rights while remaining respectful of law enforcement.`

    const completion = await openai.chat.completions.create({
      model: "google/gemini-2.0-flash-001",
      messages: [
        {
          role: "system",
          content: "You are a legal information assistant. Provide accurate, educational information about legal rights. Always include disclaimers that this is not legal advice and recommend consulting with qualified attorneys for specific situations."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.3
    })

    return completion.choices[0].message.content
  } catch (error) {
    console.error('Error generating legal guide:', error)
    
    // Fallback content if API fails
    return getFallbackLegalGuide(state, category)
  }
}

export const generateDeescalationScript = async (scenario, language) => {
  try {
    const languageInstruction = language === 'es' ? 'Respond in Spanish' : 'Respond in English'
    
    const prompt = `Create de-escalation phrases for ${scenario} situations. ${languageInstruction}.
    
    Provide 5-7 calm, respectful phrases that:
    - Assert rights without being confrontational
    - De-escalate tension
    - Show cooperation while maintaining boundaries
    - Are easy to remember under stress
    
    Format as simple sentences, one per line. Keep language clear and non-threatening.`

    const completion = await openai.chat.completions.create({
      model: "google/gemini-2.0-flash-001",
      messages: [
        {
          role: "system",
          content: "You are a conflict de-escalation expert. Create phrases that help people communicate calmly and assertively while protecting their rights."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 800,
      temperature: 0.2
    })

    return completion.choices[0].message.content
  } catch (error) {
    console.error('Error generating de-escalation script:', error)
    
    // Fallback content if API fails
    return getFallbackScript(scenario, language)
  }
}

// Fallback content when API is unavailable
const getFallbackLegalGuide = (state, category) => {
  return `# ${category.replace('-', ' ').toUpperCase()} RIGHTS IN ${state.toUpperCase()}

## Your Constitutional Rights
- You have the right to remain silent (5th Amendment)
- You have the right to refuse searches without a warrant (4th Amendment)
- You have the right to an attorney
- You have the right to know why you're being stopped

## Key Guidelines
1. Stay calm and keep your hands visible
2. Do not resist, even if you believe the stop is unlawful
3. Clearly state "I am exercising my right to remain silent"
4. Ask "Am I free to go?" if you're unsure about detention
5. Do not consent to searches - say "I do not consent to any searches"

## Important Notes
- Laws vary by state and situation
- This is educational information, not legal advice
- Contact a qualified attorney for specific legal questions
- Document interactions when safely possible

## Emergency Contacts
- Know your local ACLU chapter
- Have a lawyer's contact information ready
- Emergency: 911`
}

const getFallbackScript = (scenario, language) => {
  const englishScripts = {
    'traffic-stop': [
      "Good afternoon, officer. How can I help you today?",
      "I'm going to reach for my license and registration slowly.",
      "I understand you're doing your job. I want to cooperate safely.",
      "I prefer to exercise my right to remain silent.",
      "Am I free to go, or am I being detained?",
      "I do not consent to any searches of my vehicle.",
      "May I ask what the reason for this stop is?"
    ],
    'identification-request': [
      "I understand you need to see identification.",
      "May I ask if I'm required to show ID in this situation?",
      "I want to comply with the law. What are my obligations here?",
      "I prefer to exercise my right to remain silent beyond providing required identification.",
      "Am I free to leave if I provide the requested information?"
    ],
    'search-request': [
      "I understand you'd like to search, but I do not consent to any searches.",
      "I'm exercising my Fourth Amendment rights.",
      "I prefer to remain silent and have my attorney present.",
      "I will not physically resist, but I do not give permission.",
      "May I see the warrant, please?"
    ],
    'questioning': [
      "I'm exercising my right to remain silent.",
      "I would like to speak with an attorney before answering questions.",
      "I understand you have a job to do, but I prefer not to answer questions.",
      "Am I free to go, or am I being detained?",
      "I want to cooperate, but I need my lawyer present."
    ]
  }

  const spanishScripts = {
    'traffic-stop': [
      "Buenas tardes, oficial. ¿Cómo puedo ayudarle?",
      "Voy a alcanzar mi licencia y registro lentamente.",
      "Entiendo que está haciendo su trabajo. Quiero cooperar de manera segura.",
      "Prefiero ejercer mi derecho a permanecer en silencio.",
      "¿Soy libre de irme, o estoy siendo detenido?",
      "No consiento a ninguna búsqueda de mi vehículo.",
      "¿Puedo preguntar cuál es la razón de esta parada?"
    ],
    'identification-request': [
      "Entiendo que necesita ver identificación.",
      "¿Puedo preguntar si estoy obligado a mostrar identificación en esta situación?",
      "Quiero cumplir con la ley. ¿Cuáles son mis obligaciones aquí?",
      "Prefiero ejercer mi derecho a permanecer en silencio más allá de proporcionar la identificación requerida.",
      "¿Soy libre de irme si proporciono la información solicitada?"
    ],
    'search-request': [
      "Entiendo que le gustaría registrar, pero no consiento a ninguna búsqueda.",
      "Estoy ejerciendo mis derechos de la Cuarta Enmienda.",
      "Prefiero permanecer en silencio y tener a mi abogado presente.",
      "No resistiré físicamente, pero no doy permiso.",
      "¿Puedo ver la orden de registro, por favor?"
    ],
    'questioning': [
      "Estoy ejerciendo mi derecho a permanecer en silencio.",
      "Me gustaría hablar con un abogado antes de responder preguntas.",
      "Entiendo que tiene un trabajo que hacer, pero prefiero no responder preguntas.",
      "¿Soy libre de irme, o estoy siendo detenido?",
      "Quiero cooperar, pero necesito que mi abogado esté presente."
    ]
  }

  const scripts = language === 'es' ? spanishScripts : englishScripts
  return scripts[scenario]?.join('\n') || 'Scripts not available for this scenario.'
}