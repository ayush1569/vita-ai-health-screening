import OpenAI from 'openai';
import axios from 'axios';
import { REPORT_GENERATION_PROMPT } from '../prompts/intakeAgentPrompt.js';

export async function generateHealthReport({ transcript = [], callDurationSeconds = 0, clientApiKey }) {
  if (!transcript || transcript.length === 0) {
    return createEmptyReport(callDurationSeconds);
  }

  const formattedTranscriptText = transcript.map(t => `${t.role.toUpperCase()}: ${t.content}`).join('\n');

  // Try LLM parsing if key available
  if (clientApiKey || process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY) {
    try {
      const messages = [
        { role: 'system', content: REPORT_GENERATION_PROMPT },
        { role: 'user', content: `CALL DURATION: ${callDurationSeconds} seconds\n\nTRANSCRIPT:\n${formattedTranscriptText}` }
      ];

      let rawJson = null;

      if (clientApiKey || process.env.OPENAI_API_KEY) {
        const openai = new OpenAI({ apiKey: clientApiKey || process.env.OPENAI_API_KEY });
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: messages,
          response_format: { type: 'json_object' },
          temperature: 0.2,
        });
        rawJson = response.choices[0]?.message?.content;
      } else if (process.env.GROQ_API_KEY) {
        const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model: 'llama-3.3-70b-versatile',
          messages: messages,
          response_format: { type: 'json_object' },
          temperature: 0.2,
        }, {
          headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' }
        });
        rawJson = res.data?.choices[0]?.message?.content;
      }

      if (rawJson) {
        const report = JSON.parse(rawJson);
        report.callDurationSeconds = callDurationSeconds;
        report.generatedAt = new Date().toISOString();
        report.rawTranscript = transcript;
        return report;
      }
    } catch (err) {
      console.error('[Report Service] LLM generation error:', err.message);
    }
  }

  // Enhanced Fallback Medical Parsing Engine
  return createFallbackReport(transcript, callDurationSeconds);
}

function createEmptyReport(duration) {
  return {
    patientName: "Patient (Unspecified)",
    chiefComplaint: "Incomplete Call / No symptoms recorded",
    onsetAndDuration: "Unspecified",
    severityScore: 0,
    severityLabel: "Unknown",
    triageLevel: "Low Priority",
    triageColor: "green",
    keySymptoms: [],
    associatedSymptoms: [],
    relevantHistoryOrAllergies: "None reported",
    clinicalSummary: "Patient initiated call but disconnected before intake questions were completed.",
    flaggedRisks: ["Incomplete Intake Call"],
    recommendedNextSteps: ["Follow up with patient to complete full medical intake screening."],
    languageDetected: "English",
    completeness: "Aborted Call",
    callDurationSeconds: duration,
    generatedAt: new Date().toISOString(),
    rawTranscript: []
  };
}

function createFallbackReport(transcript, duration) {
  const userTurns = transcript.filter(t => t.role === 'user').map(t => t.content);
  const fullText = userTurns.join(' ');
  
  const isHindi = /[\u0900-\u097F]/.test(fullText) || /bukhar|dard|din|hai|hu|naam|kamzori/i.test(fullText);
  const isShortCall = transcript.length <= 2;

  // Extract dynamic patient name from dialogue or fallback cleanly
  const extractedName = extractNameFallback(fullText);
  const patientName = extractedName || (userTurns.length > 0 ? "Patient" : "Patient (Unspecified)");

  // Extract medical symptoms cleanly from user turns
  const extractedSymptoms = extractSymptomsFallback(fullText);
  const keySymptoms = extractedSymptoms.length > 0 
    ? extractedSymptoms 
    : [cleanTurnText(userTurns[0]) || (isHindi ? "सामान्य अस्वस्थता" : "General Health Concern")];

  // Chief complaint summary
  const chiefComplaint = keySymptoms.join(', ') + " reported during voice intake.";

  // Extract numeric severity score (1-10)
  const severityScore = extractSeverityScore(fullText);
  const severityLabel = getSeverityLabel(severityScore);
  const triageLevel = getTriageLevel(severityScore);
  const triageColor = severityScore >= 7 ? "red" : severityScore >= 5 ? "amber" : "green";

  // Timeline & Duration
  const onsetAndDuration = extractTimelineFallback(fullText) || "1 to 3 days (estimated)";

  const clinicalSummary = `Patient (${patientName}) completed a ${duration}-second voice intake screening. Primary complaint presented: ${chiefComplaint} Patient reported symptom onset of ${onsetAndDuration} and rated overall severity at ${severityScore}/10 (${severityLabel}). Recommend physician evaluation.`;

  return {
    patientName: patientName,
    chiefComplaint: chiefComplaint,
    onsetAndDuration: onsetAndDuration,
    severityScore: severityScore,
    severityLabel: severityLabel,
    triageLevel: triageLevel,
    triageColor: triageColor,
    keySymptoms: keySymptoms,
    associatedSymptoms: extractedSymptoms.slice(1),
    relevantHistoryOrAllergies: "None reported during screening",
    clinicalSummary: clinicalSummary,
    flaggedRisks: severityScore >= 7 
      ? ["High severity rating reported", "Monitor for acute changes or worsening"]
      : ["Monitor symptoms for progression"],
    recommendedNextSteps: [
      "Attending physician review of preliminary intake findings",
      "Routine clinical consultation & symptomatic treatment",
      "Advise patient to seek emergency care if severe pain or red flag symptoms develop"
    ],
    languageDetected: isHindi ? "Hindi" : "English",
    completeness: isShortCall ? "Partial Intake" : "Complete Intake",
    callDurationSeconds: duration,
    generatedAt: new Date().toISOString(),
    rawTranscript: transcript
  };
}

function extractNameFallback(text) {
  if (!text) return null;
  const match = text.match(/(?:my name is|name is|i am|naam|naam hai|mera naam|call me) ([A-Za-z\s]+?)(?:\.|\,|$|like|i feel|and|my|probably|for|since|having|feeling)/i);
  if (match && match[1]) {
    const cleaned = match[1].trim();
    if (cleaned.length > 1 && cleaned.length < 35 && !/weakness|fever|pain|cough|indigestion|sick|bad|good|very|moderate|high/i.test(cleaned)) {
      return cleaned.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
  }
  return null;
}

function extractSymptomsFallback(text) {
  const symptoms = [];
  const lower = text.toLowerCase();

  if (lower.includes('weakness') || lower.includes('kamzori') || lower.includes('tired') || lower.includes('fatigue')) {
    symptoms.push('General Weakness & Fatigue');
  }
  if (lower.includes('digestion') || lower.includes('pait') || lower.includes('stomach') || lower.includes('indigestion') || lower.includes('gas')) {
    symptoms.push('Digestive Discomfort / Indigestion');
  }
  if (lower.includes('fever') || lower.includes('bukhar') || lower.includes('temperature')) {
    symptoms.push('Fever');
  }
  if (lower.includes('headache') || lower.includes('sir dard') || lower.includes('head pain')) {
    symptoms.push('Headache');
  }
  if (lower.includes('cough') || lower.includes('khasi') || lower.includes('throat')) {
    symptoms.push('Cough / Sore Throat');
  }
  if (lower.includes('pain') || lower.includes('dard')) {
    if (!symptoms.some(s => s.includes('Pain') || s.includes('Headache'))) {
      symptoms.push('Body Discomfort / Pain');
    }
  }

  return symptoms;
}

function extractSeverityScore(text) {
  const match = text.match(/(?:severity|scale|rate|rating|pain|level|probably|number|score|around)?\s*(?:is|of|at|around)?\s*([1-9]|10)\b/i);
  if (match && match[1]) {
    const val = parseInt(match[1], 10);
    if (val >= 1 && val <= 10) return val;
  }
  return 6; // Default moderate score
}

function getSeverityLabel(score) {
  if (score >= 8) return "Severe";
  if (score >= 6) return "Moderate to Severe";
  if (score >= 4) return "Moderate";
  return "Mild";
}

function getTriageLevel(score) {
  if (score >= 8) return "High Priority";
  if (score >= 6) return "Moderate Priority";
  return "Low Priority";
}

function extractTimelineFallback(text) {
  const lower = text.toLowerCase();
  if (lower.includes('today') || lower.includes('few hours') || lower.includes('gante')) return "Less than 24 hours";
  if (lower.includes('yesterday') || lower.includes('1 day') || lower.includes('2 days') || lower.includes('din')) return "1 to 2 days";
  if (lower.includes('week') || lower.includes('hafte')) return "1 week or longer";
  return "1 to 3 days (estimated)";
}

function cleanTurnText(text) {
  if (!text) return '';
  return text.replace(/(?:hello|hi|aura|vita|ai|like|what i feel right now|my name is [A-Za-z\s]+)/gi, '').trim();
}
