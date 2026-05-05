import React from 'react';
import { HiOutlineDocumentMagnifyingGlass } from 'react-icons/hi2';
import './RAGSources.css';

function RAGSources({ sources }) {
  return (
    <div className="rag-panel">
      <h3 className="panel-title">
        <HiOutlineDocumentMagnifyingGlass />
        RAG Sources
      </h3>

      <div className="rag-list">
        {sources.length === 0 ? (
          <p className="rag-empty">
            Retrieved document chunks will appear here when the agent uses the knowledge base...
          </p>
        ) : (
          sources.map((source, i) => (
            <div key={i} className="rag-item glass-card">
              <div className="rag-item-header">
                <span className="rag-source-name">{source.source}</span>
                <span className="rag-score">
                  {(source.score * 100).toFixed(0)}% match
                </span>
              </div>
              <p className="rag-text">{source.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default RAGSources;
