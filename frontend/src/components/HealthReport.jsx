import React, { useState } from 'react';
import { FileText, AlertTriangle, CheckCircle, Clock, User, Activity, Download, Copy, RefreshCw, ChevronDown, ChevronUp, ShieldAlert, Stethoscope } from 'lucide-react';

export function HealthReport({ report, onNewCall }) {
  const [showRawTranscript, setShowRawTranscript] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!report) return null;

  const handleCopySummary = () => {
    const textToCopy = `AURA AI CLINICAL HEALTH INTAKE REPORT
-----------------------------------------
Patient: ${report.patientName}
Chief Complaint: ${report.chiefComplaint}
Onset & Duration: ${report.onsetAndDuration}
Severity Score: ${report.severityScore}/10 (${report.severityLabel})
Triage Level: ${report.triageLevel}
Language: ${report.languageDetected}

CLINICAL SUMMARY:
${report.clinicalSummary}

KEY SYMPTOMS:
${(report.keySymptoms || []).join(', ')}

RISK FLAGS:
${(report.flaggedRisks || []).join(', ')}

RECOMMENDED NEXT STEPS:
${(report.recommendedNextSteps || []).join(', ')}
`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getTriageBadge = () => {
    const level = report.triageLevel || 'Low Priority';
    if (level.includes('Emergency') || level.includes('High')) {
      return <span className="badge badge-red"><ShieldAlert size={13} /> {level}</span>;
    } else if (level.includes('Moderate')) {
      return <span className="badge badge-amber"><AlertTriangle size={13} /> {level}</span>;
    } else {
      return <span className="badge badge-green"><CheckCircle size={13} /> {level}</span>;
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '36px auto', padding: '0 24px' }}>
      
      {/* Top Banner & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '1.6rem', color: 'var(--text-main)' }}>Structured Medical Intake Report</h2>
            {getTriageBadge()}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
            Generated on {new Date(report.generatedAt || Date.now()).toLocaleString()} • Status: <strong style={{ color: 'var(--primary-cyan)' }}>{report.completeness}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleCopySummary} className="btn-secondary">
            <Copy size={16} />
            {copied ? 'Copied to Clipboard!' : 'Copy Summary'}
          </button>
          <button onClick={() => window.print()} className="btn-secondary">
            <Download size={16} />
            Print / Save PDF
          </button>
          <button onClick={onNewCall} className="btn-primary">
            <RefreshCw size={16} />
            New Intake Call
          </button>
        </div>
      </div>

      {/* Main Report Document Container */}
      <div className="glass-panel" style={{ padding: '36px', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
        
        {/* Patient Demographics & Key Indicators Header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', paddingBottom: '28px', borderBottom: '1px solid var(--border-color)' }}>
          
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', textTransform: 'uppercase', fontWeight: '700' }}>Patient Name</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={16} color="var(--primary-cyan)" />
              {report.patientName || 'Not Provided'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', textTransform: 'uppercase', fontWeight: '700' }}>Call Duration</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} color="var(--accent-purple)" />
              {report.callDurationSeconds || 0} seconds
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', textTransform: 'uppercase', fontWeight: '700' }}>Language Used</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '4px' }}>
              {report.languageDetected || 'English'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', textTransform: 'uppercase', fontWeight: '700' }}>Severity Level</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--accent-amber)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={16} />
              {report.severityScore || 0}/10 ({report.severityLabel || 'Mild'})
            </div>
          </div>

        </div>

        {/* Chief Complaint Card */}
        <div style={{ marginTop: '28px', background: 'rgba(0, 242, 254, 0.05)', border: '1px solid rgba(0, 242, 254, 0.2)', borderRadius: '14px', padding: '20px' }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--primary-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Chief Complaint & Present Illness
          </h3>
          <p style={{ fontSize: '1.1rem', fontWeight: '600', color: '#FFFFFF', lineHeight: '1.5' }}>
            "{report.chiefComplaint}"
          </p>
          <div style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <strong>Onset & Timeline:</strong> {report.onsetAndDuration || 'Unspecified'}
          </div>
        </div>

        {/* Physician Clinical Summary Narrative */}
        <div style={{ marginTop: '28px' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Stethoscope size={18} color="var(--accent-emerald)" />
            Clinical Narrative Summary for Physician
          </h3>
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px', fontSize: '0.95rem', lineHeight: '1.6', color: '#E2E8F0' }}>
            {report.clinicalSummary}
          </div>
        </div>

        {/* Key Symptoms & Associated Symptoms Tags */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '28px' }}>
          
          <div>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase' }}>
              Primary Reported Symptoms
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {(report.keySymptoms && report.keySymptoms.length > 0) ? (
                report.keySymptoms.map((sym, idx) => (
                  <span key={idx} className="badge badge-cyan" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
                    {sym}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-sub)' }}>None specifically listed</span>
              )}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase' }}>
              Medical History / Allergies
            </h4>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', background: 'rgba(255, 255, 255, 0.03)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              {report.relevantHistoryOrAllergies || 'None reported'}
            </div>
          </div>

        </div>

        {/* Risk Alerts / Warnings if present */}
        {report.flaggedRisks && report.flaggedRisks.length > 0 && (
          <div style={{ marginTop: '28px', background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.25)', borderRadius: '14px', padding: '20px' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#FB7185', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <AlertTriangle size={18} />
              Flagged Risk Alerts & Warnings
            </h4>
            <ul style={{ paddingLeft: '20px', color: '#FECDD3', fontSize: '0.9rem', lineHeight: '1.6' }}>
              {report.flaggedRisks.map((risk, idx) => (
                <li key={idx}>{risk}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommended Next Steps */}
        <div style={{ marginTop: '28px' }}>
          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>
            Recommended Next Steps & Clinical Follow-up
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(report.recommendedNextSteps || []).map((step, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255, 255, 255, 0.04)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                <CheckCircle size={16} color="var(--accent-emerald)" />
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Raw Transcript Expander */}
        <div style={{ marginTop: '36px', paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
          <button 
            onClick={() => setShowRawTranscript(!showRawTranscript)}
            className="btn-secondary"
            style={{ width: '100%', justifyContent: 'space-between' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={16} />
              View Full Raw Transcript Logs ({report.rawTranscript ? report.rawTranscript.length : 0} Turns)
            </span>
            {showRawTranscript ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {showRawTranscript && report.rawTranscript && (
            <div style={{ marginTop: '16px', background: 'rgba(7, 10, 19, 0.6)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color)', maxHeight: '350px', overflowY: 'auto' }}>
              {report.rawTranscript.map((t, idx) => (
                <div key={idx} style={{ marginBottom: '12px', fontSize: '0.85rem' }}>
                  <span style={{ color: t.role === 'user' ? 'var(--primary-cyan)' : 'var(--accent-emerald)', fontWeight: '700' }}>
                    {t.role.toUpperCase()}:
                  </span>{' '}
                  <span style={{ color: '#CBD5E1' }}>{t.content}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
