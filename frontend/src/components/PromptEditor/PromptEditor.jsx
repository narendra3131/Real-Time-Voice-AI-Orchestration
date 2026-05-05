import React, { useState, useEffect } from 'react';
import { HiOutlineArrowPath, HiOutlineCheck } from 'react-icons/hi2';
import { getPrompt, updatePrompt, resetPrompt } from '../../services/api.js';
import './PromptEditor.css';

function PromptEditor() {
  const [prompt, setPrompt] = useState('');
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getPrompt();
        setPrompt(data.prompt);
        setOriginalPrompt(data.prompt);
      } catch (err) {
        console.error('Failed to load prompt:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = await updatePrompt(prompt);
      setOriginalPrompt(data.prompt);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save prompt:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset to the default system prompt?')) return;
    try {
      const data = await resetPrompt();
      setPrompt(data.prompt);
      setOriginalPrompt(data.prompt);
    } catch (err) {
      console.error('Failed to reset prompt:', err);
    }
  };

  const hasChanges = prompt !== originalPrompt;

  if (loading) {
    return (
      <div className="prompt-editor fade-in">
        <div className="kb-loading"><span className="spinner-lg"></span></div>
      </div>
    );
  }

  return (
    <div className="prompt-editor fade-in">
      <div className="pe-header">
        <h2 className="gradient-text">System Prompt</h2>
        <p className="pe-subtitle">
          Customize how the AI agent behaves. Changes take effect on the next call.
        </p>
      </div>

      <div className="pe-editor glass-card">
        <textarea
          id="prompt-textarea"
          className="pe-textarea"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter the system prompt for the AI agent..."
          rows={12}
        />
        <div className="pe-footer">
          <span className="char-count">{prompt.length} characters</span>
          <div className="pe-actions">
            <button
              className="btn-secondary"
              onClick={handleReset}
              title="Reset to default prompt"
            >
              <HiOutlineArrowPath />
              Reset
            </button>
            <button
              className={`btn-primary ${saved ? 'btn-saved' : ''}`}
              onClick={handleSave}
              disabled={!hasChanges || saving}
            >
              {saving ? (
                <><span className="spinner"></span> Saving...</>
              ) : saved ? (
                <><HiOutlineCheck /> Saved!</>
              ) : (
                'Save Prompt'
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="pe-hint glass-card">
        <h4>💡 Tips</h4>
        <ul>
          <li>Define the agent's personality, tone, and expertise</li>
          <li>Instruct it to use knowledge base documents when available</li>
          <li>Keep prompts conversational — the agent speaks via voice</li>
          <li>Changes apply to the <strong>next call</strong>, not the current one</li>
        </ul>
      </div>
    </div>
  );
}

export default PromptEditor;
