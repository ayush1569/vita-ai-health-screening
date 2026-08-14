import React, { useState } from 'react';
import { useVoiceCall } from './hooks/useVoiceCall';
import { Header } from './components/Header';
import { CallInterface } from './components/CallInterface';
import { HealthReport } from './components/HealthReport';
import { SettingsModal } from './components/SettingsModal';
import { Sparkles, Shield, Stethoscope, Mic, Cpu, FileText, HeartPulse } from 'lucide-react';

export function App() {
  const {
    callState,
    language,
    setLanguage,
    apiKey,
    updateApiKey,
    transcript,
    callDuration,
    report,
    error,
    sttInterimText,
    startCall,
    endCall,
    resetCall,
    startRecordingTurn,
    stopRecordingTurn,
    sendUserTurnText,
    handleBargeIn
  } = useVoiceCall();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top sticky Navigation */}
      <Header 
        callState={callState}
        language={language}
        setLanguage={setLanguage}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content View Container */}
      <main style={{ flex: 1, paddingBottom: '60px' }}>
        
        {/* Hero Welcome Banner */}
        {callState === 'idle' && !report && (
          <div style={{ maxWidth: '1100px', margin: '36px auto 0 auto', textAlign: 'center', padding: '0 24px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(0, 242, 254, 0.08)', border: '1px solid rgba(0, 242, 254, 0.25)', padding: '6px 18px', borderRadius: '20px', fontSize: '0.82rem', color: 'var(--primary-cyan)', marginBottom: '18px' }}>
              <HeartPulse size={15} /> CONVERSATIONAL HEALTH AI — SASAHYOG TECHNOLOGIES
            </div>
            
            <h1 style={{ fontSize: '2.8rem', lineHeight: '1.2', marginBottom: '18px', fontWeight: '800' }}>
              A calmer way to start a <span style={{ background: 'linear-gradient(90deg, #00F2FE 0%, #10B981 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>health conversation.</span>
            </h1>
            
            <p style={{ fontSize: '1.08rem', color: 'var(--text-muted)', maxWidth: '720px', margin: '0 auto 36px auto', lineHeight: '1.6' }}>
              <strong>Vita AI</strong> conducts a short, voice-first health screening in English or Hindi and turns the dialogue into a clear, structured doctor summary.
            </p>

            {/* Workflow steps cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', textAlign: 'left', marginBottom: '16px' }}>
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ background: 'rgba(0, 242, 254, 0.15)', width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                  <Mic size={22} color="var(--primary-cyan)" />
                </div>
                <h3 style={{ fontSize: '1.05rem', marginBottom: '6px' }}>1. Live Voice Call</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Full-duplex real-time audio transport over WebSockets with barge-in support.
                </p>
              </div>

              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ background: 'rgba(139, 92, 246, 0.15)', width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                  <Cpu size={22} color="var(--accent-purple)" />
                </div>
                <h3 style={{ fontSize: '1.05rem', marginBottom: '6px' }}>2. Adaptive Vita AI</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Asks screening questions one at a time, adapting naturally to vague patient responses.
                </p>
              </div>

              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.15)', width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                  <FileText size={22} color="var(--accent-emerald)" />
                </div>
                <h3 style={{ fontSize: '1.05rem', marginBottom: '6px' }}>3. Clinical Health Summary</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Generates structured medical intake report with chief complaint, severity, and risk triage.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Call View vs Health Report View */}
        {report && callState === 'report_ready' ? (
          <HealthReport report={report} onNewCall={resetCall} />
        ) : (
          <CallInterface 
            callState={callState}
            startCall={startCall}
            endCall={endCall}
            startRecordingTurn={startRecordingTurn}
            stopRecordingTurn={stopRecordingTurn}
            sendUserTurnText={sendUserTurnText}
            handleBargeIn={handleBargeIn}
            transcript={transcript}
            callDuration={callDuration}
            error={error}
            sttInterimText={sttInterimText}
          />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        padding: '24px',
        textAlign: 'center',
        fontSize: '0.82rem',
        color: 'var(--text-sub)',
        borderTop: '1px solid var(--border-color)'
      }}>
        Vita AI Conversational Voice Intake • Powered by Sasahyog Technologies
      </footer>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={updateApiKey}
      />

    </div>
  );
}
