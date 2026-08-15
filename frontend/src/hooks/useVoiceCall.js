import { useState, useEffect, useRef, useCallback } from 'react';

export function useVoiceCall() {
  const [callState, setCallState] = useState('idle'); // idle | connecting | active | user_speaking | ai_thinking | ai_speaking | report_ready
  const [language, setLanguage] = useState('auto'); // auto | en | hi
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('aura_api_key') || '');
  const [transcript, setTranscript] = useState([]);
  const [callDuration, setCallDuration] = useState(0);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [sttInterimText, setSttInterimText] = useState('');

  const wsRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const currentAudioRef = useRef(null);
  const speechRecognitionRef = useRef(null);
  const recognizedTextRef = useRef('');
  const activeStreamRef = useRef(null);

  const updateApiKey = (key) => {
    setApiKey(key);
    localStorage.setItem('aura_api_key', key);
  };

  useEffect(() => {
    if (callState !== 'idle' && callState !== 'report_ready' && callState !== 'connecting') {
      timerIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [callState]);

  const stopCurrentAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const playAudioChunk = useCallback((audioBase64, text, useClientFallback) => {
    stopCurrentAudio();
    setCallState('ai_speaking');

    if (audioBase64 && !useClientFallback) {
      const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
      currentAudioRef.current = audio;
      audio.onended = () => {
        setCallState('active');
      };
      audio.onerror = () => {
        playWebSpeechFallback(text);
      };
      audio.play().catch(err => {
        playWebSpeechFallback(text);
      });
    } else if (text) {
      playWebSpeechFallback(text);
    } else {
      setCallState('active');
    }
  }, [stopCurrentAudio]);

  const playWebSpeechFallback = (text) => {
    if (!('speechSynthesis' in window)) {
      setCallState('active');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const isHindi = /[\u0900-\u097F]/.test(text) || /namaste|bukhar|dard|dhanyawad/i.test(text);
    utterance.lang = isHindi ? 'hi-IN' : 'en-US';
    utterance.rate = 1.0;

    utterance.onend = () => {
      setCallState('active');
    };
    utterance.onerror = () => {
      setCallState('active');
    };

    window.speechSynthesis.speak(utterance);
  };

  const getApiUrl = (endpoint) => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `http://${window.location.hostname}:5000${endpoint}`;
    }
    return `https://vita-ai-health-screening.onrender.com${endpoint}`;
  };

  const getWebSocketUrl = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `ws://${window.location.hostname}:5000/ws`;
    }
    return `wss://vita-ai-health-screening.onrender.com/ws`;
  };

  const startCall = useCallback(async () => {
    setError(null);
    setCallState('connecting');
    setCallDuration(0);
    setTranscript([]);
    setReport(null);

    const wsUrl = getWebSocketUrl();

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setCallState('active');
        ws.send(JSON.stringify({
          type: 'start_call',
          language,
          apiKey
        }));
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);

        switch (msg.type) {
          case 'ai_thinking':
            setCallState('ai_thinking');
            break;
          case 'stt_processing':
            setCallState('user_speaking');
            break;
          case 'stt_result':
            setSttInterimText('');
            if (msg.text) {
              setTranscript(prev => [...prev, { role: 'user', content: msg.text, timestamp: new Date().toLocaleTimeString() }]);
            }
            break;
          case 'ai_turn':
            setSttInterimText('');
            if (msg.text) {
              setTranscript(prev => [...prev, { role: 'assistant', content: msg.text, timestamp: new Date().toLocaleTimeString() }]);
              playAudioChunk(msg.audioBase64, msg.text, msg.useClientFallback);
            } else {
              setCallState('active');
            }
            break;
          case 'ai_interrupted':
            stopCurrentAudio();
            setCallState('active');
            break;
          case 'call_ended':
            stopCurrentAudio();
            setReport(msg.report);
            setCallState('report_ready');
            ws.close();
            break;
          case 'error':
            setError(msg.message);
            setCallState('active');
            break;
        }
      };

      ws.onerror = (err) => {
        startCallHttpFallback();
      };

      ws.onclose = () => {};
    } catch (err) {
      startCallHttpFallback();
    }
  }, [language, apiKey, playAudioChunk, stopCurrentAudio]);

  const startCallHttpFallback = async () => {
    try {
      setCallState('active');
      const res = await fetch(getApiUrl('/api/process-turn'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userText: '', history: [], language, apiKey })
      });
      const data = await res.json();
      if (data.text) {
        setTranscript([{ role: 'assistant', content: data.text, timestamp: new Date().toLocaleTimeString() }]);
        playAudioChunk(data.audioBase64, data.text, data.useClientFallback);
      }
    } catch (e) {
      setError('Connection notice: Running in client zero-config voice mode.');
      setCallState('active');
    }
  };

  const sendUserTurnText = useCallback((text) => {
    stopCurrentAudio();
    setCallState('ai_thinking');
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'user_turn',
        text
      }));
    } else {
      sendUserTurnHttp(text);
    }
  }, [stopCurrentAudio]);

  const sendUserTurnHttp = async (text) => {
    const updatedHistory = [...transcript, { role: 'user', content: text, timestamp: new Date().toLocaleTimeString() }];
    setTranscript(updatedHistory);
    try {
      const res = await fetch(getApiUrl('/api/process-turn'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userText: text, history: updatedHistory, language, apiKey })
      });
      const data = await res.json();
      if (data.text) {
        setTranscript([...updatedHistory, { role: 'assistant', content: data.text, timestamp: new Date().toLocaleTimeString() }]);
        playAudioChunk(data.audioBase64, data.text, data.useClientFallback);
      }
    } catch (err) {
      setError('Connection notice: Processing turn in client voice mode.');
      setCallState('active');
    }
  };

  const startRecordingTurn = useCallback(async () => {
    stopCurrentAudio();
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'barge_in' }));
    }

    setSttInterimText('');
    recognizedTextRef.current = '';

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        if (speechRecognitionRef.current) {
          try { speechRecognitionRef.current.stop(); } catch (e) {}
        }
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';

        recognition.onresult = (event) => {
          let interim = '';
          let final = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          if (final) {
            recognizedTextRef.current += ' ' + final;
          }
          setSttInterimText(interim || recognizedTextRef.current.trim());
        };

        recognition.start();
        speechRecognitionRef.current = recognition;
      } catch (e) {
        console.warn('SpeechRecognition notice:', e);
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      activeStreamRef.current = stream;
      audioChunksRef.current = [];

      let options = {};
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          options = { mimeType: 'audio/webm;codecs=opus' };
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          options = { mimeType: 'audio/webm' };
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          options = { mimeType: 'audio/mp4' };
        }
      }

      const mediaRecorder = options.mimeType ? new MediaRecorder(stream, options) : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (speechRecognitionRef.current) {
          try { speechRecognitionRef.current.stop(); } catch (e) {}
        }

        const finalText = recognizedTextRef.current.trim() || sttInterimText.trim();
        const mimeUsed = options.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeUsed });
        
        if (audioBlob.size > 0) {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64Audio = reader.result.split(',')[1];
            setCallState('ai_thinking');
            
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({
                type: 'user_turn',
                text: finalText,
                audioBase64: base64Audio,
                mimeType: mimeUsed
              }));
            } else {
              sendUserTurnText(finalText || "Patient provided response");
            }
          };
        } else {
          sendUserTurnText(finalText || "Patient provided response");
        }

        if (activeStreamRef.current) {
          activeStreamRef.current.getTracks().forEach(track => track.stop());
          activeStreamRef.current = null;
        }
      };

      mediaRecorder.start();
      setCallState('user_speaking');
    } catch (err) {
      console.warn('Microphone access notice:', err);
      setCallState('user_speaking');
    }
  }, [stopCurrentAudio, language, sttInterimText, sendUserTurnText]);

  const stopRecordingTurn = useCallback(() => {
    let stoppedMediaRecorder = false;
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state === 'recording' || mediaRecorderRef.current.state === 'paused') {
        try {
          mediaRecorderRef.current.stop();
          stoppedMediaRecorder = true;
        } catch (e) {
          console.warn('Error stopping MediaRecorder:', e);
        }
      }
    }

    if (speechRecognitionRef.current) {
      try { speechRecognitionRef.current.stop(); } catch (e) {}
    }

    // Mobile Safeguard: If MediaRecorder was not active or failed to trigger onstop event, submit immediately!
    if (!stoppedMediaRecorder) {
      const finalText = recognizedTextRef.current.trim() || sttInterimText.trim();
      if (finalText) {
        sendUserTurnText(finalText);
      } else {
        sendUserTurnText("Patient completed voice response");
      }
    }
  }, [sendUserTurnText, sttInterimText]);

  const handleBargeIn = useCallback(() => {
    stopCurrentAudio();
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'barge_in' }));
    }
    setCallState('active');
  }, [stopCurrentAudio]);

  const endCall = useCallback(async () => {
    stopCurrentAudio();
    stopRecordingTurn();
    setCallState('ending_call');

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'end_call' }));
    } else {
      try {
        const res = await fetch(getApiUrl('/api/generate-report'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript, durationSeconds: callDuration, apiKey })
        });
        const reportData = await res.json();
        setReport(reportData);
        setCallState('report_ready');
      } catch (err) {
        setError('Report generation notice: Switch to client summary view.');
        setCallState('idle');
      }
    }
  }, [stopCurrentAudio, stopRecordingTurn, transcript, callDuration, apiKey]);

  const resetCall = useCallback(() => {
    stopCurrentAudio();
    setCallState('idle');
    setTranscript([]);
    setReport(null);
    setCallDuration(0);
    setError(null);
  }, [stopCurrentAudio]);

  return {
    callState,
    language,
    setLanguage,
    apiKey,
    updateApiKey,
    transcript,
    callDuration,
    report,
    error,
    isMuted,
    setIsMuted,
    sttInterimText,
    startCall,
    endCall,
    resetCall,
    startRecordingTurn,
    stopRecordingTurn,
    sendUserTurnText,
    handleBargeIn
  };
}
