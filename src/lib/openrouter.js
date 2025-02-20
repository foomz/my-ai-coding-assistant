import toast from 'react-hot-toast';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const SITE_URL = window.location.origin;
const SITE_NAME = 'AI Chat Assistant';

export async function sendMessage(messages) {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': SITE_URL,
        'X-Title': SITE_NAME,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-r1-distill-llama-70b:free',
        messages: messages.map(msg => ({
          role: msg.role,
          content: typeof msg.content === 'string' ? msg.content : msg.content.text
        }))
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenRouter API response:', data); // Log the response for debugging

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No choices returned from OpenRouter API');
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('OpenRouter API Error:', error);
    toast.error('Error getting AI response');
    return 'I apologize, but I encountered an error processing your request. Please try again.';
  }
}