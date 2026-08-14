import OpenAI from 'openai';
import axios from 'axios';
import { SYSTEM_INTAKE_PROMPT } from '../prompts/intakeAgentPrompt.js';

export async function generateIntakeResponse({ conversationHistory = [], userUtterance = '', languagePreference = 'auto', clientApiKey }) {
  const apiKey = clientApiKey || process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY;

  // Initial Greeting if call just started
  if (conversationHistory.length === 0 && !userUtterance) {
    const greetingEnglish = "Hello! I'm Vita, your AI health intake assistant powered by Sasahyog Technologies. Could you start by sharing your full name and what main health concern brings you in today?";
    const greetingHindi = "नमस्ते! मैं वीटा (Vita) हूँ, आपकी AI हेल्थ इनटेक असिस्टेंट। क्या आप अपना नाम और आज की अपनी मुख्य स्वास्थ्य समस्या बता सकते हैं?";
    
    const greeting = languagePreference === 'hi' ? greetingHindi : greetingEnglish;
    return {
      text: greeting,
      isComplete: false,
      provider: 'system-greeting'
    };
  }

  const messages = [
    { role: 'system', content: SYSTEM_INTAKE_PROMPT }
  ];

  for (const turn of conversationHistory) {
    if (turn.role && turn.content) {
      messages.push({ role: turn.role, content: turn.content });
    }
  }

  if (userUtterance) {
    messages.push({ role: 'user', content: userUtterance });
  }

  // 1. OpenAI GPT-4o / GPT-4o-mini
  if (clientApiKey || process.env.OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({ apiKey: clientApiKey || process.env.OPENAI_API_KEY });
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
        max_tokens: 250,
      });

      let responseText = response.choices[0]?.message?.content?.trim() || '';
      const isComplete = responseText.includes('[INTAKE_COMPLETE]');
      responseText = responseText.replace('[INTAKE_COMPLETE]', '').trim();

      return {
        text: responseText,
        isComplete,
        provider: 'openai-gpt-4o-mini'
      };
    } catch (err) {
      console.error('[LLM Service] OpenAI error:', err.message);
    }
  }

  // 2. Groq Llama 3 API fallback
  if (process.env.GROQ_API_KEY) {
    try {
      const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'llama-3.3-70b-versatile',
        messages: messages,
        temperature: 0.7,
        max_tokens: 250,
      }, {
        headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' }
      });

      let responseText = res.data?.choices[0]?.message?.content?.trim() || '';
      const isComplete = responseText.includes('[INTAKE_COMPLETE]');
      responseText = responseText.replace('[INTAKE_COMPLETE]', '').trim();

      return {
        text: responseText,
        isComplete,
        provider: 'groq-llama-3'
      };
    } catch (err) {
      console.error('[LLM Service] Groq error:', err.message);
    }
  }

  // 3. Fallback Engine
  return generateIntakeFallback({ conversationHistory, userUtterance, languagePreference });
}

function generateIntakeFallback({ conversationHistory, userUtterance, languagePreference }) {
  const isHindi = /[\u0900-\u097F]/.test(userUtterance) || languagePreference === 'hi' || /namaste|bukhar|dard|din|hai|hu|kamzori/i.test(userUtterance);
  const turnsCount = conversationHistory.length;

  let replyText = "";
  let isComplete = false;

  if (turnsCount <= 1) {
    replyText = isHindi 
      ? "धन्यवाद जानकारी देने के लिए। क्या आप बता सकते हैं कि यह समस्या आपको कितने दिनों या घंटों से हो रही है?"
      : "Thank you for sharing that. Could you tell me how long you've been experiencing this issue and if it started suddenly or gradually?";
  } else if (turnsCount <= 3) {
    replyText = isHindi
      ? "समझ गया। 1 से 10 के पैमाने पर, जहाँ 10 सबसे अधिक दर्द है, आप अपनी तकलीफ या दर्द को कितना अंक देंगे?"
      : "I understand. On a scale of 1 to 10, with 10 being the most severe pain or discomfort, how would you rate what you're feeling right now?";
  } else if (turnsCount <= 5) {
    replyText = isHindi
      ? "क्या आपको इसके अलावा कोई और लक्षण जैसे बुखार, चक्कर, या मतली महसूस हो रही है? और क्या आपकी कोई पुरानी बीमारी या एलर्जी है?"
      : "Are you noticing any other associated symptoms like fever, dizziness, or nausea? Also, do you have any pre-existing medical conditions or allergies?";
  } else {
    replyText = isHindi
      ? "बहुत-बहुत धन्यवाद। मैंने आपकी सभी जानकारी दर्ज कर ली है। अब मैं आपकी इनटेक रिपोर्ट तैयार कर रहा हूँ जो आपके डॉक्टर को भेजी जाएगी। टेक केयर!"
      : "Thank you very much. I have collected all the necessary screening details. I am now compiling your formal intake report for the attending doctor. Take care!";
    isComplete = true;
  }

  return {
    text: replyText,
    isComplete,
    provider: 'fallback-rules-engine'
  };
}
