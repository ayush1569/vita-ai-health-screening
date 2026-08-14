import React from 'react';
import { Activity, Settings, Globe, ShieldCheck, HeartPulse } from 'lucide-react';

export function Header({ callState, language, setLanguage, onOpenSettings }) {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '18px 32px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      background: 'rgba(7, 10, 19, 0.85)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Brand Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #00F2FE 0%, #10B981 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px rgba(0, 242, 254, 0.4)'
        }}>
          <HeartPulse size={26} color="#070A13" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.35rem', fontWeight: '800', background: 'linear-gradient(90deg, #FFFFFF 0%, #38BDF8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Vita AI
            </h1>
            <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
              <ShieldCheck size={12} /> POWERED BY SASAHYOG TECHNOLOGIES
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Voice-First Clinical Health Intake & Screening
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Language Selector */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '6px 12px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)'
        }}>
          <Globe size={16} color="var(--primary-cyan)" />
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            disabled={callState !== 'idle' && callState !== 'report_ready'}
            style={{
              background: 'transparent',
              color: 'var(--text-main)',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="auto" style={{ background: '#0E1424' }}>🌐 Auto-Detect Language</option>
            <option value="en" style={{ background: '#0E1424' }}>🇺🇸 English</option>
            <option value="hi" style={{ background: '#0E1424' }}>🇮🇳 हिन्दी (Hindi)</option>
          </select>
        </div>

        {/* Settings Launcher */}
        <button 
          onClick={onOpenSettings} 
          className="btn-secondary" 
          title="API Key Configuration"
          style={{ padding: '10px 14px' }}
        >
          <Settings size={18} />
          <span style={{ fontSize: '0.85rem' }}>API Keys</span>
        </button>
      </div>
    </header>
  );
}
