import React, { useEffect, useRef } from 'react';
import { HiOutlineUser, HiOutlineCpuChip } from 'react-icons/hi2';
import './Transcript.css';

function Transcript({ transcripts }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts]);

  return (
    <div className="transcript-panel">
      <h3 className="panel-title">
        <span className="panel-dot live"></span>
        Live Transcript
      </h3>

      <div className="transcript-list" ref={scrollRef}>
        {transcripts.length === 0 ? (
          <p className="transcript-empty">
            Transcript will appear here during the call...
          </p>
        ) : (
          transcripts.map((t, i) => (
            <div key={i} className={`transcript-item ${t.role}`}>
              <div className="transcript-avatar">
                {t.role === 'user' ? <HiOutlineUser /> : <HiOutlineCpuChip />}
              </div>
              <div className="transcript-content">
                <div className="transcript-meta">
                  <span className="transcript-role">
                    {t.role === 'user' ? 'You' : 'Agent'}
                  </span>
                  <span className="transcript-time">{t.timestamp}</span>
                </div>
                <p className="transcript-text">{t.text}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Transcript;
