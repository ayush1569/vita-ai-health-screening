import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { transcribeAudio } from './services/sttService.js';
import { generateIntakeResponse } from './services/llmService.js';
import { textToSpeech } from './services/ttsService.js';
import { generateHealthReport } from './services/reportService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const PORT = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json({ limit: '25mb' }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Vita AI Health Intake Server - Powered by Sasahyog Technologies',
    time: new Date().toISOString(),
    providersAvailable: {
      openai: !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim()),
      groq: !!(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim()),
      elevenlabs: !!(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_API_KEY.trim()),
    }
  });
});

// REST API for direct turn processing
app.post('/api/process-turn', async (req, res) => {
  try {
    const { userText, history = [], language = 'auto', apiKey } = req.body;

    const llmResult = await generateIntakeResponse({
      conversationHistory: history,
      userUtterance: userText || 'Patient submitted screening update',
      languagePreference: language,
      clientApiKey: apiKey
    });

    const ttsResult = await textToSpeech({
      text: llmResult.text,
      clientApiKey: apiKey
    });

    res.json({
      text: llmResult.text,
      isComplete: llmResult.isComplete,
      provider: llmResult.provider,
      audioBase64: ttsResult.audioBuffer ? ttsResult.audioBuffer.toString('base64') : null,
      useClientFallback: ttsResult.useClientFallback
    });
  } catch (err) {
    console.error('[API process-turn error]:', err);
    res.status(500).json({ error: err.message });
  }
});

// REST API for generating health report
app.post('/api/generate-report', async (req, res) => {
  try {
    const { transcript, durationSeconds, apiKey } = req.body;
    const report = await generateHealthReport({
      transcript,
      callDurationSeconds: durationSeconds,
      clientApiKey: apiKey
    });
    res.json(report);
  } catch (err) {
    console.error('[API generate-report error]:', err);
    res.status(500).json({ error: err.message });
  }
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const sessions = new Map();

wss.on('connection', (ws) => {
  const sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
  
  const session = {
    id: sessionId,
    ws,
    startTime: Date.now(),
    history: [],
    language: 'auto',
    apiKey: null,
    isProcessing: false,
    activeAudioAbort: false
  };

  sessions.set(sessionId, session);
  console.log(`[WebSocket] Client connected: ${sessionId}`);

  ws.send(JSON.stringify({ type: 'connected', sessionId }));

  ws.on('message', async (data, isBinary) => {
    try {
      if (isBinary) {
        handleBinaryAudio(session, data);
        return;
      }

      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'start_call': {
          session.startTime = Date.now();
          session.history = [];
          session.language = message.language || 'auto';
          session.apiKey = message.apiKey || null;

          ws.send(JSON.stringify({ type: 'call_started', sessionId }));

          session.isProcessing = true;
          ws.send(JSON.stringify({ type: 'ai_thinking' }));

          const greetingResult = await generateIntakeResponse({
            conversationHistory: [],
            userUtterance: '',
            languagePreference: session.language,
            clientApiKey: session.apiKey
          });

          session.history.push({
            role: 'assistant',
            content: greetingResult.text,
            timestamp: new Date().toISOString()
          });

          const ttsResult = await textToSpeech({
            text: greetingResult.text,
            clientApiKey: session.apiKey
          });

          session.isProcessing = false;
          ws.send(JSON.stringify({
            type: 'ai_turn',
            text: greetingResult.text,
            audioBase64: ttsResult.audioBuffer ? ttsResult.audioBuffer.toString('base64') : null,
            useClientFallback: ttsResult.useClientFallback,
            isComplete: greetingResult.isComplete
          }));
          break;
        }

        case 'barge_in':
        case 'user_speech_start': {
          session.activeAudioAbort = true;
          ws.send(JSON.stringify({ type: 'ai_interrupted' }));
          break;
        }

        case 'user_turn': {
          session.activeAudioAbort = false;
          session.isProcessing = true;
          
          let userText = message.text || '';
          
          if (!userText && message.audioBase64) {
            const buffer = Buffer.from(message.audioBase64, 'base64');
            ws.send(JSON.stringify({ type: 'stt_processing' }));
            const sttResult = await transcribeAudio({
              audioBuffer: buffer,
              mimeType: message.mimeType || 'audio/webm',
              clientApiKey: session.apiKey
            });
            userText = sttResult.text || userText;
          }

          if (!userText || !userText.trim()) {
            userText = session.language === 'hi' ? "मुझे स्वास्थ्य समस्या है" : "I have a health concern";
          }

          ws.send(JSON.stringify({ type: 'stt_result', text: userText }));

          session.history.push({
            role: 'user',
            content: userText,
            timestamp: new Date().toISOString()
          });

          ws.send(JSON.stringify({ type: 'ai_thinking' }));

          const llmResult = await generateIntakeResponse({
            conversationHistory: session.history,
            userUtterance: '',
            languagePreference: session.language,
            clientApiKey: session.apiKey
          });

          session.history.push({
            role: 'assistant',
            content: llmResult.text,
            timestamp: new Date().toISOString()
          });

          const ttsResult = await textToSpeech({
            text: llmResult.text,
            clientApiKey: session.apiKey
          });

          session.isProcessing = false;

          if (!session.activeAudioAbort) {
            ws.send(JSON.stringify({
              type: 'ai_turn',
              text: llmResult.text,
              audioBase64: ttsResult.audioBuffer ? ttsResult.audioBuffer.toString('base64') : null,
              useClientFallback: ttsResult.useClientFallback,
              isComplete: llmResult.isComplete
            }));
          }

          if (llmResult.isComplete) {
            triggerReportGeneration(session);
          }
          break;
        }

        case 'end_call': {
          triggerReportGeneration(session);
          break;
        }
      }
    } catch (err) {
      console.error(`[WebSocket Error - ${sessionId}]:`, err);
      ws.send(JSON.stringify({ type: 'error', message: err.message }));
      session.isProcessing = false;
    }
  });

  ws.on('close', () => {
    console.log(`[WebSocket] Client disconnected: ${sessionId}`);
    sessions.delete(sessionId);
  });
});

async function triggerReportGeneration(session) {
  const durationSeconds = Math.round((Date.now() - session.startTime) / 1000);
  session.ws.send(JSON.stringify({ type: 'generating_report' }));

  const report = await generateHealthReport({
    transcript: session.history,
    callDurationSeconds: durationSeconds,
    clientApiKey: session.apiKey
  });

  session.ws.send(JSON.stringify({
    type: 'call_ended',
    report: report
  }));
}

async function handleBinaryAudio(session, audioBuffer) {
  try {
    session.ws.send(JSON.stringify({ type: 'stt_processing' }));
    const sttResult = await transcribeAudio({
      audioBuffer,
      mimeType: 'audio/webm',
      clientApiKey: session.apiKey
    });

    const userText = sttResult.text || (session.language === 'hi' ? "मुझे स्वास्थ्य समस्या है" : "I have a health concern");
    session.ws.send(JSON.stringify({ type: 'stt_result', text: userText }));
    session.history.push({ role: 'user', content: userText, timestamp: new Date().toISOString() });
    
    const llmResult = await generateIntakeResponse({
      conversationHistory: session.history,
      userUtterance: '',
      languagePreference: session.language,
      clientApiKey: session.apiKey
    });

    session.history.push({ role: 'assistant', content: llmResult.text, timestamp: new Date().toISOString() });
    
    const ttsResult = await textToSpeech({ text: llmResult.text, clientApiKey: session.apiKey });

    session.ws.send(JSON.stringify({
      type: 'ai_turn',
      text: llmResult.text,
      audioBase64: ttsResult.audioBuffer ? ttsResult.audioBuffer.toString('base64') : null,
      useClientFallback: ttsResult.useClientFallback,
      isComplete: llmResult.isComplete
    }));
  } catch (err) {
    console.error('[Binary Audio Handler Error]:', err);
  }
}

server.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`  🏥 Vita AI Health Intake Server Running`);
  console.log(`  🏢 Powered by Sasahyog Technologies`);
  console.log(`  🔑 OpenAI Cloud Key: ACTIVE`);
  console.log(`  📡 HTTP Server: http://localhost:${PORT}`);
  console.log(`  ⚡ WebSocket Server: ws://localhost:${PORT}/ws`);
  console.log(`==================================================\n`);
});
