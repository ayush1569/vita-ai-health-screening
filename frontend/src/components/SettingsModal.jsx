import React, { useState } from 'react';
import { X, Key, Check, Info, Shield } from 'lucide-react';

export function SettingsModal({ isOpen, onClose, apiKey, onSaveApiKey }) {
  const [keyInput, setKeyInput] = useState(apiKey || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveApiKey(keyInput.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(7, 10, 19, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '24px'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '32px', position: 'relative' }}>
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ background: 'rgba(0, 242, 254, 0.15)', padding: '10px', borderRadius: '12px' }}>
            <Key size={20} color="var(--primary-cyan)" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem' }}>API Configuration</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Configure custom AI provider keys</p>
          </div>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px', margin: '20px 0', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
          <div style={{ display: 'flex', gap: '8px', color: 'var(--primary-cyan)', fontWeight: '600', marginBottom: '4px' }}>
            <Info size={16} /> Optional Browser Configuration
          </div>
          Enter your OpenAI / Groq / ElevenLabs API key below for direct browser-to-server speech & LLM synthesis. If left empty, Aura automatically runs using the backend's environment variables or zero-config fallback mode.
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-main)' }}>
              OpenAI API Key (sk-...)
            </label>
            <input
              type="password"
              placeholder="sk-proj-..."
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '14px 16px',
                color: 'var(--text-main)',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {savedSuccess ? (
                <>
                  <Check size={16} /> Saved!
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </form>

        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-sub)' }}>
          <Shield size={14} /> Keys are stored locally in your browser memory and never persisted externally.
        </div>

      </div>
    </div>
  );
}
