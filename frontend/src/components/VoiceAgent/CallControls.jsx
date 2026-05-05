import React from 'react';
import { HiOutlinePhone, HiOutlinePhoneXMark } from 'react-icons/hi2';

function CallControls({ connectionState, onConnect, onDisconnect }) {
  const isConnected = connectionState === 'connected';
  const isConnecting = connectionState === 'connecting';

  return (
    <div className="call-controls">
      {isConnected ? (
        <button
          id="btn-end-call"
          className="call-btn call-btn-end"
          onClick={onDisconnect}
        >
          <HiOutlinePhoneXMark />
          <span>End Call</span>
        </button>
      ) : (
        <button
          id="btn-start-call"
          className="call-btn call-btn-start"
          onClick={onConnect}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <>
              <span className="spinner"></span>
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <HiOutlinePhone />
              <span>Start Call</span>
            </>
          )}
        </button>
      )}

      <style>{`
        .call-controls {
          display: flex;
          justify-content: center;
          gap: var(--space-md);
          width: 100%;
          padding: 0 var(--space-md);
        }

        .call-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-sm);
          padding: var(--space-md) var(--space-2xl);
          border-radius: var(--radius-full);
          border: none;
          font-family: var(--font-family);
          font-size: var(--font-size-base);
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-base);
          min-width: 180px;
          max-width: 300px;
          width: 100%;
        }

        .call-btn svg {
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .call-btn-start {
          background: var(--accent-gradient);
          color: white;
          box-shadow: 0 4px 20px var(--accent-glow);
        }

        .call-btn-start:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 30px var(--accent-glow);
        }

        .call-btn-start:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .call-btn-end {
          background: var(--danger);
          color: white;
          box-shadow: 0 4px 20px var(--danger-glow);
        }

        .call-btn-end:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 30px var(--danger-glow);
          background: #dc2626;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          flex-shrink: 0;
        }

        /* Mobile */
        @media (max-width: 768px) {
          .call-btn {
            padding: var(--space-md) var(--space-xl);
            font-size: var(--font-size-sm);
            min-width: 150px;
          }
        }

        @media (max-width: 480px) {
          .call-btn {
            padding: var(--space-sm) var(--space-lg);
            font-size: var(--font-size-sm);
            min-width: 140px;
          }
        }
      `}</style>
    </div>
  );
}

export default CallControls;
