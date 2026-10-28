import React from 'react';
import { usePWA } from '../context/PWAContext';
import { Download, Smartphone, X, Check, Monitor, Share, PlusSquare, MoreVertical, Compass } from 'lucide-react';

export const PWAInstallModal = ({ isOpen, onClose, isIOS }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      padding: '1.25rem'
    }}>
      <div className="animate-fade" style={{
        background: 'var(--bg-card, #1C1C24)',
        border: '1px solid var(--border, rgba(255,255,255,0.12))',
        borderRadius: '20px',
        padding: '1.75rem',
        maxWidth: '480px',
        width: '100%',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
        position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255,255,255,0.05)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            color: 'var(--text-secondary, #94A3B8)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'var(--transition, all 0.2s)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary, #94A3B8)'}
        >
          <X size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.25rem' }}>
          <div style={{
            background: 'rgba(224, 109, 67, 0.15)',
            color: 'var(--primary, #E06D43)',
            padding: '10px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Smartphone size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', color: '#fff', margin: 0, fontWeight: 700 }}>
              Install COMPLAX App
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #94A3B8)', margin: '2px 0 0 0' }}>
              Install on your device for fast, 1-click access.
            </p>
          </div>
        </div>

        {isIOS ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary, #E06D43)' }}>
              How to install on iOS / Safari:
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#E2E8F0' }}>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '6px', borderRadius: '8px', flexShrink: 0 }}>
                <Share size={18} color="#E06D43" />
              </div>
              <span>1. Tap the <strong>Share</strong> button in Safari toolbar.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#E2E8F0' }}>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '6px', borderRadius: '8px', flexShrink: 0 }}>
                <PlusSquare size={18} color="#E06D43" />
              </div>
              <span>2. Scroll down and tap <strong>Add to Home Screen</strong>.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#E2E8F0' }}>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '6px', borderRadius: '8px', flexShrink: 0 }}>
                <Check size={18} color="#34D399" />
              </div>
              <span>3. Confirm <strong>Add</strong> at top right. Done!</span>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary, #E06D43)' }}>
              How to install on Chrome / Edge / Desktop:
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#E2E8F0' }}>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '6px', borderRadius: '8px', flexShrink: 0 }}>
                <Monitor size={18} color="#E06D43" />
              </div>
              <span>1. Look for the <strong>Install icon</strong> (<Download size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />) in your browser address bar.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#E2E8F0' }}>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '6px', borderRadius: '8px', flexShrink: 0 }}>
                <MoreVertical size={18} color="#E06D43" />
              </div>
              <span>2. Or open browser menu (<strong>⋮</strong> or <strong>…</strong>) &rarr; <strong>Install COMPLAX</strong> or <strong>Apps &rarr; Install</strong>.</span>
            </div>
          </div>
        )}

        <div style={{ marginTop: '1.25rem', textAlign: 'right' }}>
          <button
            onClick={onClose}
            className="btn-primary"
            style={{ padding: '8px 20px', fontSize: '0.85rem' }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export const InstallPwaButton = ({ variant = 'navbar', className = '' }) => {
  const {
    isInstalled,
    isInstallable,
    isIOS,
    showInstallModal,
    installSuccess,
    promptInstall,
    closeInstallModal
  } = usePWA();

  // If running inside installed standalone app, do not show button
  if (isInstalled) {
    return null;
  }

  if (variant === 'navbar') {
    return (
      <>
        <button
          onClick={promptInstall}
          title="Install COMPLAX App"
          className={className}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(224, 109, 67, 0.12)',
            border: '1px solid rgba(224, 109, 67, 0.35)',
            color: 'var(--primary, #E06D43)',
            padding: '6px 14px',
            borderRadius: '10px',
            fontSize: '0.825rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--primary, #E06D43)';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(224, 109, 67, 0.12)';
            e.currentTarget.style.color = 'var(--primary, #E06D43)';
          }}
        >
          <Download size={15} />
          <span>Install App</span>
        </button>

        <PWAInstallModal
          isOpen={showInstallModal}
          onClose={closeInstallModal}
          isIOS={isIOS}
        />
      </>
    );
  }

  // Variant: primary / solid (for landing page Home or hero CTA)
  return (
    <>
      <button
        onClick={promptInstall}
        className={`btn solid ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer'
        }}
      >
        <Download size={18} />
        <span>Install App</span>
      </button>

      {installSuccess && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 99999,
          background: '#10B981',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          fontWeight: 700,
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Check size={18} />
          <span>COMPLAX App installed successfully!</span>
        </div>
      )}

      <PWAInstallModal
        isOpen={showInstallModal}
        onClose={closeInstallModal}
        isIOS={isIOS}
      />
    </>
  );
};

export default InstallPwaButton;
