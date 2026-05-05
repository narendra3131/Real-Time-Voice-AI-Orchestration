import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { HiOutlineCloudArrowUp, HiOutlineTrash, HiOutlineDocument, HiOutlineCheckCircle } from 'react-icons/hi2';
import { uploadDocument, listDocuments, deleteDocument } from '../../services/api.js';
import './KnowledgeBase.css';

function KnowledgeBase() {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    try {
      const data = await listDocuments();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    setUploadStatus(null);

    for (const file of acceptedFiles) {
      try {
        await uploadDocument(file);
        setUploadStatus({ type: 'success', message: `"${file.name}" uploaded and processed successfully!` });
      } catch (err) {
        const msg = err.response?.data?.detail || 'Upload failed';
        setUploadStatus({ type: 'error', message: `Failed to upload "${file.name}": ${msg}` });
      }
    }

    setUploading(false);
    fetchDocuments();

    setTimeout(() => setUploadStatus(null), 5000);
  }, [fetchDocuments]);

  const handleDelete = async (docId, filename) => {
    if (!window.confirm(`Delete "${filename}" from the knowledge base?`)) return;

    try {
      await deleteDocument(docId);
      fetchDocuments();
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'text/csv': ['.csv'],
    },
    multiple: true,
    disabled: uploading,
  });

  return (
    <div className="knowledge-base fade-in">
      <div className="kb-header">
        <h2 className="gradient-text">Knowledge Base</h2>
        <p className="kb-subtitle">
          Upload documents to give the AI agent knowledge to answer your questions from.
        </p>
      </div>

      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`upload-zone glass-card ${isDragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
        id="upload-zone"
      >
        <input {...getInputProps()} id="file-input" />
        {uploading ? (
          <div className="upload-content">
            <span className="spinner-lg"></span>
            <p className="upload-text">Processing document...</p>
          </div>
        ) : (
          <div className="upload-content">
            <HiOutlineCloudArrowUp className="upload-icon" />
            <p className="upload-text">
              {isDragActive ? 'Drop files here...' : 'Drag & drop files here'}
            </p>
            <p className="upload-hint">or click to browse — PDF, DOCX, TXT, MD, CSV</p>
          </div>
        )}
      </div>

      {/* Status Message */}
      {uploadStatus && (
        <div className={`upload-status ${uploadStatus.type}`}>
          {uploadStatus.type === 'success' ? <HiOutlineCheckCircle /> : <span>⚠️</span>}
          <span>{uploadStatus.message}</span>
        </div>
      )}

      {/* Document List */}
      <div className="kb-documents">
        <h3 className="section-title">
          Uploaded Documents
          <span className="doc-count">{documents.length}</span>
        </h3>

        {loading ? (
          <div className="kb-loading">
            <span className="spinner-lg"></span>
          </div>
        ) : documents.length === 0 ? (
          <div className="kb-empty glass-card">
            <HiOutlineDocument className="empty-icon" />
            <p>No documents uploaded yet</p>
            <p className="empty-hint">Upload documents to build your knowledge base</p>
          </div>
        ) : (
          <div className="doc-list">
            {documents.map((doc) => (
              <div key={doc.id} className="doc-item glass-card">
                <div className="doc-info">
                  <HiOutlineDocument className="doc-icon" />
                  <div>
                    <p className="doc-name">{doc.filename}</p>
                    <p className="doc-meta">
                      {doc.chunks} chunks · {(doc.characters / 1000).toFixed(1)}k chars
                    </p>
                  </div>
                </div>
                <button
                  className="btn-danger doc-delete"
                  onClick={() => handleDelete(doc.id, doc.filename)}
                  title="Delete document"
                >
                  <HiOutlineTrash />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default KnowledgeBase;
