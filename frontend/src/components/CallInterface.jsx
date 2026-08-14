import React, { useState } from 'react';
import { PhoneCall, PhoneOff, Mic, MicOff, Volume2, Sparkles, AlertCircle, MessageSquare, Clock, ArrowRight, CheckCircle2, Circle, Activity, Radio, Square } from 'lucide-react';
import { AudioVisualizer } from './AudioVisualizer';

export function CallInterface({
  callState,
  startCall,
  endCall,
  startRecordingTurn,
  stopRecordingTurn,
  sendUserTurnText,
  handleBargeIn,
  transcript,
  callDuration,
  error,
  sttInterimText
}) {
  const [inputText, setInputText] = useState('');

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTextInputSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      sendUserTurnText(inputText.trim());
      setInputText('');
    }
  };

  const calculateChecklistProgress = () => {
    let count = 0;
    const fullText = transcript.map(t => t.content).join(' ');
    
    if (/name is|naam|i am/i.test(fullText) || transcript.length >= 1) count++;
    if (transcript.length >= 2) count++;
    if (/day|din|week|today|since|hours|gante/i.test(fullText) || transcript.length >= 4) count++;
    if (/\b[1-9]|10\b/i.test(fullText) || transcript.length >= 5) count++;
    if (transcript.length >= 6) count++;

    return Math.min(count, 5);
  };

  const slotsCount = calculateChecklistProgress();
  const progressPercent = Math.round((slotsCount / 5) * 100);

  const getStatusText = () => {
    switch (callState) {
      case 'idle':
        return 'Ready to Begin Clinical Intake Screening';
      case 'connecting':
        return 'Establishing Real-time Transport...';
      case 'active':
        return 'Vita Listening... Click Push to Speak when ready';
      case 'user_speaking':
        return 'Recording Patient Speech... Click Done Speaking when finished';
      case 'ai_thinking':
        return 'Vita Synthesizing Clinical Response...';
      case 'ai_speaking':
        return 'Vita Speaking — (Click Barge-in to interrupt)';
      case 'ending_call':
        return 'Compiling Structured Medical Summary...';
      default:
        return 'Session Active';
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '28px auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Banner Session Bar */}
      <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(0, 242, 254, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Radio size={20} color="var(--primary-cyan)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Live Health Screening Session</h2>
              <span className="badge badge-cyan" style={{ padding: '2px 8px', fontSize: '0.75rem' }}>
                <Clock size={12} /> {formatTimer(callDuration)}
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Speak in English or Hindi. Vita AI will ask adaptive screening questions.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className={`badge ${callState === 'ai_speaking' ? 'badge-green' : callState === 'user_speaking' ? 'badge-amber' : 'badge-cyan'}`}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'currentColor', display: 'inline-block' }}></span>
            {callState.toUpperCase()}
          </span>

          {callState !== 'idle' && (
            <button onClick={endCall} className="btn-danger" style={{ padding: '10px 18px', fontSize: '0.85rem' }}>
              <PhoneOff size={16} />
              End Call & Get Report
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Left Audio Orb & Progress Checklist / Right Live Dialogue */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 440px', gap: '24px' }}>
        
        {/* Left Card: Live Voice Orb & Control Buttons */}
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '600px' }}>
          
          <div style={{ textAlign: 'center' }}>
            
            {/* Central Glowing Voice Orb */}
            <div className={`voice-orb-container ${callState === 'ai_speaking' || callState === 'user_speaking' ? 'voice-orb-active' : ''}`}>
              <div className="voice-orb-ring-1"></div>
              <div className="voice-orb-ring-2"></div>
              <div className="voice-orb-ring-3">
                {callState === 'ai_speaking' ? (
                  <Volume2 size={44} color="#070A13" />
                ) : callState === 'user_speaking' ? (
                  <Mic size={44} color="#070A13" />
                ) : (
                  <Sparkles size={44} color="#070A13" />
                )}
              </div>
            </div>

            <h3 style={{ marginTop: '24px', fontSize: '1.3rem', color: 'var(--text-main)' }}>
              {getStatusText()}
            </h3>

            {sttInterimText && (
              <p style={{ marginTop: '8px', fontSize: '0.92rem', color: 'var(--primary-cyan)', fontStyle: 'italic' }}>
                "{sttInterimText}"
              </p>
            )}

            {/* Audio Waveform Canvas */}
            <div style={{ width: '85%', margin: '20px auto 0 auto' }}>
              <AudioVisualizer 
                isActive={callState === 'ai_speaking' || callState === 'user_speaking'} 
                mode={callState === 'user_speaking' ? 'user' : 'ai'}
              />
            </div>

          </div>

          {/* Error Alert */}
          {error && (
            <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '12px', padding: '12px', color: '#FB7185', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Individual Dedicated Control Buttons */}
          <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
            
            {callState === 'idle' ? (
              <button onClick={startCall} className="btn-primary" style={{ padding: '16px 42px', fontSize: '1.1rem' }}>
                <PhoneCall size={22} />
                Start Health Intake Call
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                
                {/* Dedicated Button 1: Push to Speak */}
                <button 
                  onClick={startRecordingTurn} 
                  className="btn-secondary" 
                  disabled={callState === 'user_speaking' || callState === 'ai_thinking' || callState === 'ending_call'}
                  style={{
                    opacity: callState === 'user_speaking' ? 0.4 : 1,
                    borderColor: 'rgba(16, 185, 129, 0.4)'
                  }}
                >
                  <Mic size={18} color="var(--accent-emerald)" />
                  Push to Speak
                </button>

                {/* Dedicated Button 2: Done Speaking */}
                <button 
                  onClick={stopRecordingTurn} 
                  className="btn-primary" 
                  disabled={callState !== 'user_speaking'}
                  style={{
                    background: callState === 'user_speaking' 
                      ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' 
                      : 'rgba(255, 255, 255, 0.08)',
                    color: callState === 'user_speaking' ? '#070A13' : 'var(--text-sub)',
                    boxShadow: callState === 'user_speaking' ? '0 0 20px rgba(16, 185, 129, 0.5)' : 'none',
                    opacity: callState === 'user_speaking' ? 1 : 0.4,
                    cursor: callState === 'user_speaking' ? 'pointer' : 'not-allowed'
                  }}
                >
                  <Square size={16} fill="currentColor" />
                  Done Speaking
                </button>

                {/* Dedicated Button 3: Barge-in (Interrupt AI) */}
                {callState === 'ai_speaking' && (
                  <button onClick={handleBargeIn} className="btn-secondary" style={{ borderColor: 'rgba(245, 158, 11, 0.4)', color: '#FBBF24' }}>
                    Barge-in (Interrupt AI)
                  </button>
                )}
              </div>
            )}

            {/* Text Input Fallback */}
            {callState !== 'idle' && callState !== 'ending_call' && (
              <form onSubmit={handleTextInputSubmit} style={{ width: '100%', display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Or type what you want to say (English or Hindi)..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    color: 'var(--text-main)',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
                <button type="submit" className="btn-secondary" style={{ padding: '12px 16px' }}>
                  <ArrowRight size={18} />
                </button>
              </form>
            )}

          </div>

          {/* Intake Progress Checklist Card */}
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>
                <Activity size={16} color="var(--primary-cyan)" />
                Intake Progress Checklist
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--primary-cyan)', fontWeight: '700' }}>
                {progressPercent}% ({slotsCount}/5 Collected)
              </div>
            </div>

            <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden', marginBottom: '14px' }}>
              <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, #00F2FE 0%, #10B981 100%)', transition: 'width 0.4s ease' }}></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {slotsCount >= 1 ? <CheckCircle2 size={14} color="#10B981" /> : <Circle size={14} />}
                <span>Patient Name</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {slotsCount >= 2 ? <CheckCircle2 size={14} color="#10B981" /> : <Circle size={14} />}
                <span>Chief Complaint</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {slotsCount >= 3 ? <CheckCircle2 size={14} color="#10B981" /> : <Circle size={14} />}
                <span>Onset & Duration</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {slotsCount >= 4 ? <CheckCircle2 size={14} color="#10B981" /> : <Circle size={14} />}
                <span>Severity (1-10)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', gridColumn: 'span 2' }}>
                {slotsCount >= 5 ? <CheckCircle2 size={14} color="#10B981" /> : <Circle size={14} />}
                <span>Associated Symptoms & History</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Card: Live Transcript & Dialogue */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '600px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={18} color="var(--primary-cyan)" />
              Live Transcript & Dialogue
            </h3>
            <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
              {transcript.length} Turns
            </span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 4px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {transcript.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-sub)', marginTop: '60px', fontSize: '0.85rem' }}>
                <p>Transcript will update live as the screening conversation progresses.</p>
              </div>
            ) : (
              transcript.map((item, idx) => {
                const isHindiTurn = /[\u0900-\u097F]/.test(item.content);
                return (
                  <div 
                    key={idx}
                    style={{
                      alignSelf: item.role === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '90%',
                      background: item.role === 'user' ? 'rgba(0, 242, 254, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${item.role === 'user' ? 'rgba(0, 242, 254, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                      borderRadius: item.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      padding: '12px 14px',
                      fontSize: '0.88rem',
                      lineHeight: '1.45'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      <strong style={{ color: item.role === 'user' ? 'var(--primary-cyan)' : '#34D399' }}>
                        {item.role === 'user' ? 'Patient' : 'Vita (AI Assistant)'}
                      </strong>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '1px 5px', borderRadius: '4px', fontSize: '0.65rem' }}>
                          {isHindiTurn ? 'हिंदी' : 'EN'}
                        </span>
                        <span>{item.timestamp || ''}</span>
                      </div>
                    </div>
                    <div>{item.content}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
