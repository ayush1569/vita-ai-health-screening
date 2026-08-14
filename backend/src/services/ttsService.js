import OpenAI from 'openai';
import axios from 'axios';

export async function textToSpeech({ text, voice = 'nova', clientApiKey, preferredProvider = 'openai' }) {
  if (!text || !text.trim()) {
    return { audioBuffer: null, useClientFallback: true };
  }

  // 1. OpenAI TTS API
  if ((preferredProvider === 'openai' || !process.env.ELEVENLABS_API_KEY) && (clientApiKey || process.env.OPENAI_API_KEY)) {
    try {
      const openai = new OpenAI({ apiKey: clientApiKey || process.env.OPENAI_API_KEY });
      const response = await openai.audio.speech.create({
        model: 'tts-1',
        voice: voice, // 'alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'
        input: text,
        response_format: 'mp3',
        speed: 1.0,
      });

      const buffer = Buffer.from(await response.arrayBuffer());
      return {
        audioBuffer: buffer,
        contentType: 'audio/mp3',
        provider: 'openai-tts',
        useClientFallback: false
      };
    } catch (err) {
      console.error('[TTS Service] OpenAI TTS error:', err.message);
    }
  }

  // 2. ElevenLabs TTS API
  if (process.env.ELEVENLABS_API_KEY) {
    try {
      const voiceId = '21m00Tcm4TlvDq8ikWAM'; // Rachel voice
      const res = await axios.post(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      }, {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        responseType: 'arraybuffer'
      });

      return {
        audioBuffer: Buffer.from(res.data),
        contentType: 'audio/mpeg',
        provider: 'elevenlabs-tts',
        useClientFallback: false
      };
    } catch (err) {
      console.error('[TTS Service] ElevenLabs error:', err.message);
    }
  }

  // 3. Fallback: Tell client to use Web Speech Synthesis
  return {
    audioBuffer: null,
    provider: 'client-web-speech',
    useClientFallback: true
  };
}
