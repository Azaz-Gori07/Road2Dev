import React, { useState, useEffect, useCallback } from 'react';
import { getVoiceDiagnosticsData, getBestVoiceMatch } from '../utils/voiceEngine';

const TABLE_HEADER_STYLE = {
  padding: '6px 8px',
  textAlign: 'left',
  fontSize: '11px',
  fontWeight: '700',
  color: 'var(--text-muted)',
  borderBottom: '1px solid var(--border)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const CELL_STYLE = {
  padding: '5px 8px',
  fontSize: '11.5px',
  borderBottom: '1px solid rgba(255,255,255,0.04)',
};

export default function VoiceDiagnosticsPanel({ preferredLanguage, onClose }) {
  const [diagData, setDiagData] = useState(null);
  const [recommended, setRecommended] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const refresh = useCallback(() => {
    const data = getVoiceDiagnosticsData();
    setDiagData(data);

    if (preferredLanguage) {
      const match = getBestVoiceMatch(preferredLanguage);
      if (match.voice) {
        setRecommended({ name: match.voice.name, lang: match.voice.lang, log: match.log });
      } else {
        setRecommended({ name: null, lang: null, log: match.log });
      }
    }
  }, [preferredLanguage]);

  useEffect(() => {
    const handler = () => refresh();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.addEventListener('voiceschanged', handler);
    }
    refresh();
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.removeEventListener('voiceschanged', handler);
      }
    };
  }, [refresh]);

  const containerStyle = {
    background: 'var(--surface-alt)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '12px',
    marginTop: '8px',
    fontSize: '12px',
    color: 'var(--text-secondary)',
    maxHeight: expanded ? '400px' : '52px',
    overflow: 'hidden',
    transition: 'max-height 0.3s ease',
    position: 'relative',
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    userSelect: 'none',
  };

  const badgeStyle = (ok) => ({
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: '700',
    background: ok ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
    color: ok ? '#10b981' : '#ef4444',
  });

  if (!diagData) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle} onClick={() => setExpanded(!expanded)}>
          <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>🎤 Voice Diagnostics</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle} onClick={() => setExpanded(!expanded)}>
        <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>🎤 Voice Diagnostics</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={badgeStyle(diagData.ttsSupported)}>TTS {diagData.ttsSupported ? '✓' : '✗'}</span>
          <span style={badgeStyle(diagData.sttSupported)}>STT {diagData.sttSupported ? '✓' : '✗'}</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{diagData.totalVoices} voices</span>
          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: '10px' }}>
          {/* Recommended voice section */}
          {preferredLanguage && recommended && (
            <div style={{
              padding: '8px 10px',
              borderRadius: '6px',
              marginBottom: '10px',
              background: recommended.name
                ? 'rgba(16, 185, 129, 0.08)'
                : 'rgba(239, 68, 68, 0.08)',
              border: recommended.name
                ? '1px solid rgba(16, 185, 129, 0.2)'
                : '1px solid rgba(239, 68, 68, 0.2)',
            }}>
              <div style={{ fontWeight: '600', fontSize: '11px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                {recommended.name
                  ? `✓ Recommended: "${recommended.name}" (${recommended.lang})`
                  : `✗ No voice found for "${preferredLanguage}"`}
              </div>
              {recommended.log && recommended.log.fallbackReason && (
                <div style={{ fontSize: '10.5px', color: '#f59e0b', marginTop: '2px' }}>
                  ⚠️ {recommended.log.fallbackReason}
                </div>
              )}
            </div>
          )}

          {/* Voice table */}
          {diagData.voices.length > 0 ? (
            <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={TABLE_HEADER_STYLE}>Voice Name</th>
                    <th style={TABLE_HEADER_STYLE}>Locale</th>
                    <th style={{ ...TABLE_HEADER_STYLE, textAlign: 'center' }}>Default</th>
                    <th style={{ ...TABLE_HEADER_STYLE, textAlign: 'center' }}>Local</th>
                  </tr>
                </thead>
                <tbody>
                  {diagData.voices.map((v, i) => {
                    const isRecommended = recommended && v.name === recommended.name && v.lang === recommended.lang;
                    return (
                      <tr key={i} style={{
                        background: isRecommended ? 'rgba(139, 92, 246, 0.08)' : 'transparent',
                      }}>
                        <td style={{ ...CELL_STYLE, fontWeight: isRecommended ? '700' : '400', color: isRecommended ? '#c084fc' : undefined }}>
                          {v.name}
                          {isRecommended && <span style={{ marginLeft: '4px', fontSize: '10px', color: '#8b5cf6' }}>★</span>}
                        </td>
                        <td style={CELL_STYLE}>{v.lang}</td>
                        <td style={{ ...CELL_STYLE, textAlign: 'center' }}>{v.default ? '✓' : ''}</td>
                        <td style={{ ...CELL_STYLE, textAlign: 'center' }}>{v.localService ? '✓' : ''}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px' }}>
              No voices loaded. Some browsers load voices asynchronously — try refreshing.
            </div>
          )}

          {/* Refresh and close buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '8px' }}>
            <button
              onClick={refresh}
              style={{
                padding: '4px 10px',
                fontSize: '10.5px',
                fontWeight: '600',
                borderRadius: '4px',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              Refresh voices
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '4px 10px',
                fontSize: '10.5px',
                fontWeight: '600',
                borderRadius: '4px',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
