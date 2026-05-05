import React from 'react';
import { useVoiceAssistant } from '@livekit/components-react';
import AudioVisualizer from './AudioVisualizer.jsx';
import CallControls from './CallControls.jsx';
import './VoiceAgent.css';

function VoiceAgent({ connectionState, onConnect, onDisconnect, error }) {
  const isConnected = connectionState === 'connected';

  return (
    <div className="voice-agent fade-in">
      <div className="voice-agent-header">
        <h2 className="gradient-text">Voice Agent</h2>
        <p className="voice-agent-subtitle">
          {isConnected
            ? 'You are connected. Start speaking to interact with the AI agent.'
            : 'Click the button below to start a voice conversation with the AI agent.'}
        </p>
      </div>

      <div className="voice-agent-main">
        <div className="orb-container glass-card">
          {isConnected ? (
            <ConnectedView />
          ) : (
            <DisconnectedView />
          )}
        </div>

        {error && (
          <div className="error-message">
            <span>⚠️</span> {error}
          </div>
        )}

        <CallControls
          connectionState={connectionState}
          onConnect={onConnect}
          onDisconnect={onDisconnect}
        />
      </div>
    </div>
  );
}

/* Render when connected to LiveKit room */
function ConnectedView() {
  let state = 'idle';
  let audioTrack = null;

  try {
    const va = useVoiceAssistant();
    state = va.state || 'idle';
    audioTrack = va.audioTrack;
  } catch (e) {
    // Hook may fail if not inside a room context yet
  }

  const stateLabels = {
    idle: 'Listening...',
    listening: 'Listening...',
    thinking: 'Thinking...',
    speaking: 'Speaking...',
    connecting: 'Connecting...',
    initializing: 'Initializing...',
  };

  return (
    <>
      <AudioVisualizer state={state} audioTrack={audioTrack} />
      <div className="orb-status">
        <span className={`status-indicator ${state}`}></span>
        <span className="status-label">{stateLabels[state] || state}</span>
      </div>
    </>
  );
}

/* Render when not yet connected */
function DisconnectedView() {
  return (
    <>
      <div className="orb-idle">
        <div className="orb-ring orb-ring-1"></div>
        <div className="orb-ring orb-ring-2"></div>
        <div className="orb-ring orb-ring-3"></div>
        <div className="orb-core"></div>
      </div>
      <div className="orb-status">
        <span className="status-label idle-label">Ready to connect</span>
      </div>
    </>
  );
}

export default VoiceAgent;
