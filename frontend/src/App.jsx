import React, { useState, useCallback, useRef, useEffect } from 'react';
import { LiveKitRoom, RoomAudioRenderer, useDataChannel } from '@livekit/components-react';
import '@livekit/components-styles';

import Sidebar from './components/Layout/Sidebar.jsx';
import VoiceAgent from './components/VoiceAgent/VoiceAgent.jsx';
import KnowledgeBase from './components/KnowledgeBase/KnowledgeBase.jsx';
import PromptEditor from './components/PromptEditor/PromptEditor.jsx';
import Transcript from './components/Transcript/Transcript.jsx';
import RAGSources from './components/RAGSources/RAGSources.jsx';
import { getToken } from './services/api.js';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('agent');
  const [connectionState, setConnectionState] = useState('disconnected');
  const [token, setToken] = useState(null);
  const [livekitUrl, setLivekitUrl] = useState(null);
  const [transcripts, setTranscripts] = useState([]);
  const [ragSources, setRagSources] = useState([]);
  const [error, setError] = useState(null);

  const handleConnect = useCallback(async () => {
    try {
      setError(null);
      setConnectionState('connecting');
      const data = await getToken();
      setToken(data.token);
      setLivekitUrl(data.url);
      setConnectionState('connected');
    } catch (err) {
      console.error('Failed to get token:', err);
      setError('Failed to connect. Make sure the backend is running.');
      setConnectionState('disconnected');
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    setToken(null);
    setLivekitUrl(null);
    setConnectionState('disconnected');
    setTranscripts([]);
    setRagSources([]);
  }, []);

  const handleDataMessage = useCallback((msg) => {
    try {
      const data = JSON.parse(new TextDecoder().decode(msg.payload));
      if (data.type === 'transcript') {
        setTranscripts(prev => [...prev, {
          role: data.role,
          text: data.text,
          timestamp: new Date().toLocaleTimeString(),
        }]);
      } else if (data.type === 'rag_sources') {
        setRagSources(data.sources || []);
      }
    } catch (e) {
      console.warn('Failed to parse data message:', e);
    }
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'agent':
        return (
          <VoiceAgent
            connectionState={connectionState}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            error={error}
          />
        );
      case 'knowledge':
        return <KnowledgeBase />;
      case 'prompt':
        return <PromptEditor />;
      default:
        return null;
    }
  };

  const isConnected = connectionState === 'connected' && token && livekitUrl;

  return (
    <div className="app">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} connectionState={connectionState} />

      <main className="main-content">
        <div className="content-area">
          {isConnected ? (
            <LiveKitRoom
              token={token}
              serverUrl={livekitUrl}
              connect={true}
              audio={true}
              video={false}
              onDisconnected={handleDisconnect}
              onError={(err) => {
                console.error('LiveKit error:', err);
                setError('Connection error occurred.');
              }}
            >
              <RoomAudioRenderer />
              <DataChannelHandler onMessage={handleDataMessage} />
              {renderContent()}
            </LiveKitRoom>
          ) : (
            renderContent()
          )}
        </div>

        {/* Side panels: Transcript + RAG Sources */}
        {connectionState === 'connected' && (
          <aside className="side-panels">
            <Transcript transcripts={transcripts} />
            <RAGSources sources={ragSources} />
          </aside>
        )}
      </main>
    </div>
  );
}

/* Small component to hook into LiveKit data channels */
function DataChannelHandler({ onMessage }) {
  useDataChannel(undefined, onMessage);
  return null;
}

export default App;
