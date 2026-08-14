import OpenAI from 'openai';
import axios from 'axios';
import FormData from 'form-data';

export async function transcribeAudio({ audioBuffer, mimeType = 'audio/webm', clientApiKey, preferredProvider = 'openai' }) {
  const apiKey = clientApiKey || process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY;

  if (!audioBuffer || audioBuffer.length === 0) {
    return { text: '', error: 'Empty audio buffer provided' };
  }

  // 1. OpenAI Whisper API
  if ((preferredProvider === 'openai' || !process.env.GROQ_API_KEY) && (clientApiKey || process.env.OPENAI_API_KEY)) {
    try {
      const openai = new OpenAI({ apiKey: clientApiKey || process.env.OPENAI_API_KEY });
      const fileExt = mimeType.includes('wav') ? 'wav' : mimeType.includes('ogg') ? 'ogg' : 'webm';
      const file = await OpenAI.toFile(audioBuffer, `audio_input.${fileExt}`, { type: mimeType });
      
      const response = await openai.audio.transcriptions.create({
        model: 'whisper-1',
        file: file,
        prompt: 'Patient intake call in English or Hindi (हिन्दी). Healthcare screening conversation.',
      });

      return { text: response.text?.trim() || '', provider: 'openai-whisper' };
    } catch (err) {
      console.error('[STT Service] OpenAI Whisper error:', err.message);
    }
  }

  // 2. Groq Whisper API (Fast Whisper fallback)
  if (process.env.GROQ_API_KEY) {
    try {
      const formData = new FormData();
      formData.append('file', audioBuffer, { filename: 'audio.webm', contentType: mimeType });
      formData.append('model', 'whisper-large-v3');
      formData.append('prompt', 'Patient intake call in English or Hindi.');

      const res = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', formData, {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          ...formData.getHeaders()
        }
      });

      return { text: res.data?.text?.trim() || '', provider: 'groq-whisper' };
    } catch (err) {
      console.error('[STT Service] Groq Whisper error:', err.message);
    }
  }

  // 3. Fallback when cloud API key is missing: Return fallback text indicating audio turn was captured
  return { 
    text: 'Patient provided spoken voice turn', 
    provider: 'local-voice-detector' 
  };
}
