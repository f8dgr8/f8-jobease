import React, { useState } from 'react';
import mammoth from 'mammoth';

const API_URL = '/api';

export default function F8JobEaseSuite() {
  const [activeTab, setActiveTab] = useState('resume');
  const [apiKey, setApiKey] = useState('');
  const [showApiInput, setShowApiInput] = useState(true);
  
  const [baseResumes, setBaseResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [baseResume, setBaseResume] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [jobs, setJobs] = useState([]);
  const [newJob, setNewJob] = useState({ title: '', company: '', status: 'Applied', date: '' });
  
  const [jobRole, setJobRole] = useState('');
  const [customQuestions, setCustomQuestions] = useState('');
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  
  const [selectedJobForStudy, setSelectedJobForStudy] = useState('');
  const [reminderTime, setReminderTime] = useState('09:00');
  const [reminderEnabled, setReminderEnabled] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        if (result.value) {
          setBaseResume(result.value);
          alert('✅ Resume uploaded!');
        }
      } else if (file.name.endsWith('.txt')) {
        const text = await file.text();
        setBaseResume(text);
        alert('✅ Resume uploaded!');
      }
    } catch (error) {
      alert('Upload error: ' + error.message);
    }
  };

  const addBaseResume = () => {
    if (!baseResume.trim()) {
      alert('Please upload a resume first');
      return;
    }
    if (baseResumes.length >= 7) {
      alert('Maximum 7 resumes');
      return;
    }
    const name = prompt('Resume name:');
    if (!name) return;
    const newR = { id: Date.now(), name, content: baseResume };
    setBaseResumes([...baseResumes, newR]);
    setSelectedResumeId(newR.id.toString());
    alert('✅ Saved!');
  };

  const selectBaseResume = (id) => {
    setSelectedResumeId(id);
    const r = baseResumes.find(r => r.id === parseInt(id));
    if (r) setBaseResume(r.content);
  };

  const deleteBaseResume = (id) => {
    if (window.confirm('Delete?')) {
      setBaseResumes(baseResumes.filter(r => r.id !== parseInt(id)));
      if (selectedResumeId === id) {
        setSelectedResumeId('');
        setBaseResume('');
      }
    }
  };

  const handleGenerateResume = async () => {
    if (!apiKey || !baseResume || !jobDescription) {
      alert('Please fill all fields');
      return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch(`${API_URL}/generate-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, baseResume, jobDescription })
      });
      if (!res.ok) throw new Error('Failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = res.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'resume.docx';
      link.click();
      URL.revokeObjectURL(url);
      alert('✅ Resume downloaded!');
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    if (!apiKey || !baseResume || !jobDescription) {
      alert('Please fill all fields');
      return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch(`${API_URL}/generate-cover-letter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, baseResume, jobDescription })
      });
      if (!res.ok) throw new Error('Failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'FO_Cover_Letter.docx';
      link.click();
      URL.revokeObjectURL(url);
      alert('✅ Cover letter downloaded!');
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!apiKey || !jobRole) {
      alert('Enter API key and job role');
      return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch(`${API_URL}/generate-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, jobRole })
      });
      const data = await res.json();
      setGeneratedQuestions(data.questions);
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateStudyGuide = async () => {
    if (!apiKey || !selectedJobForStudy) {
      alert('Select a job');
      return;
    }
    setIsGenerating(true);
    try {
      const job = jobs.find(j => j.id === parseInt(selectedJobForStudy));
      const res = await fetch(`${API_URL}/generate-study-guide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, jobTitle: job.title, company: job.company })
      });
      if (!res.ok) throw new Error('Failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `FO_Study_Guide_${job.title.replace(/\s/g, '_')}.docx`;
      link.click();
      URL.revokeObjectURL(url);
      alert('✅ Study guide downloaded!');
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const addJob = () => {
    if (newJob.title && newJob.company) {
      setJobs([...jobs, { ...newJob, id: Date.now(), date: newJob.date || new Date().toISOString().split('T')[0] }]);
      setNewJob({ title: '', company: '', status: 'Applied', date: '' });
    }
  };

  const deleteJob = (id) => setJobs(jobs.filter(j => j.id !== id));

  const enableReminder = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(p => {
        if (p === 'granted') {
          setReminderEnabled(true);
          alert(`Reminder set for ${reminderTime}`);
        }
      });
    }
  };

  if (showApiInput) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #fef3c7, #fed7aa)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', padding: '2rem', maxWidth: '28rem', width: '100%', border: '2px solid #fed7aa' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ width: '4rem', height: '4rem', background: 'linear-gradient(to bottom right, #f97316, #f59e0b)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.875rem', fontWeight: 'bold', color: 'white', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>F8</div>
          </div>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem', textAlign: 'center' }}>Welcome to F8 JobEase</h2>
          <p style={{ color: '#4b5563', marginBottom: '1.5rem', fontSize: '0.875rem' }}>Enter your Anthropic API key to get started.</p>
          <input
            type="password"
            placeholder="sk-ant-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={{ width: '100%', padding: '1rem', background: '#fef3c7', border: '2px solid #fed7aa', borderRadius: '0.75rem', marginBottom: '1rem' }}
          />
          <button
            onClick={() => apiKey ? setShowApiInput(false) : alert('Enter API key')}
            style={{ width: '100%', background: 'linear-gradient(to right, #f97316, #f59e0b)', color: 'white', padding: '1rem', borderRadius: '0.75rem', fontWeight: '600', border: 'none', cursor: 'pointer' }}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #fef3c7, #fed7aa)' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '1.5rem' }}>
        <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden', border: '1px solid #fed7aa' }}>
          <div style={{ background: 'linear-gradient(to right, #f97316, #f59e0b, #fbbf24)', color: 'white', padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{ width: '3rem', height: '3rem', background: 'rgba(255,255,255,0.2)', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>F8</div>
              <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold' }}>JobEase Suite</h1>
            </div>
            <p style={{ color: '#fed7aa', marginTop: '0.5rem' }}>Your career acceleration toolkit</p>
          </div>

          <div style={{ display: 'flex', borderBottom: '1px solid #fed7aa', background: 'rgba(254,243,199,0.5)', flexWrap: 'wrap' }}>
            {[
              { id: 'resume', label: 'Resume' },
              { id: 'cover', label: 'Cover Letter' },
              { id: 'tracker', label: 'Job Tracker' },
              { id: 'interview', label: 'Interview' },
              { id: 'reminders', label: 'Reminders' },
              { id: 'study', label: 'Study Guide' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '0.75rem 1rem',
                  fontWeight: '500',
                  border: 'none',
                  cursor: 'pointer',
                  background: activeTab === tab.id ? '#f97316' : 'transparent',
                  color: activeTab === tab.id ? 'white' : '#374151'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: '1.5rem' }}>
            {activeTab === 'resume' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {baseResumes.length > 0 && (
                  <div style={{ background: '#dbeafe', border: '2px solid #93c5fd', borderRadius: '0.75rem', padding: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Saved Resumes ({baseResumes.length}/7)</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <select value={selectedResumeId} onChange={(e) => selectBaseResume(e.target.value)} style={{ flex: 1, padding: '0.75rem', border: '2px solid #93c5fd', borderRadius: '0.5rem' }}>
                        <option value="">-- Select --</option>
                        {baseResumes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                      {selectedResumeId && <button onClick={() => deleteBaseResume(selectedResumeId)} style={{ padding: '0 1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>Delete</button>}
                    </div>
                  </div>
                )}

                <div style={{ background: '#fef3c7', border: '2px solid #fed7aa', borderRadius: '0.75rem', padding: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Base Resume</label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <label style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', background: 'linear-gradient(to right, #a855f7, #6366f1)', color: 'white', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '500' }}>
                      📤 Upload (.docx or .txt)
                      <input type="file" accept=".txt,.docx" onChange={handleFileUpload} style={{ display: 'none' }} />
                    </label>
                    {baseResume && baseResumes.length < 7 && (
                      <button onClick={addBaseResume} style={{ padding: '0.75rem 1.5rem', background: 'linear-gradient(to right, #10b981, #059669)', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '500' }}>💾 Save</button>
                    )}
                  </div>
                  <textarea
                    value={baseResume}
                    onChange={(e) => setBaseResume(e.target.value)}
                    placeholder="Upload file or paste resume..."
                    style={{ width: '100%', height: '12rem', padding: '1rem', background: 'white', border: '2px solid #fed7aa', borderRadius: '0.5rem' }}
                  />
                </div>

                <div style={{ background: '#dbeafe', border: '2px solid #93c5fd', borderRadius: '0.75rem', padding: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Job Description</label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste job description here..."
                    style={{ width: '100%', height: '8rem', padding: '0.75rem', background: 'white', border: '2px solid #93c5fd', borderRadius: '0.5rem' }}
                  />
                </div>

                <button
                  onClick={handleGenerateResume}
                  disabled={isGenerating}
                  style={{ width: '100%', background: isGenerating ? '#9ca3af' : 'linear-gradient(to right, #10b981, #14b8a6)', color: 'white', padding: '1rem', borderRadius: '0.75rem', fontWeight: '600', border: 'none', cursor: isGenerating ? 'not-allowed' : 'pointer', fontSize: '1rem' }}
                >
                  {isGenerating ? '⏳ Generating...' : '✨ Generate Resume (.docx)'}
                </button>
              </div>
            )}

            {activeTab === 'cover' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ color: '#4b5563' }}>Use the same resume and job description from Resume tab.</p>
                <button onClick={handleGenerateCoverLetter} disabled={isGenerating} style={{ width: '100%', background: isGenerating ? '#9ca3af' : 'linear-gradient(to right, #3b82f6, #06b6d4)', color: 'white', padding: '1rem', borderRadius: '0.75rem', fontWeight: '600', border: 'none', cursor: isGenerating ? 'not-allowed' : 'pointer' }}>
                  {isGenerating ? '⏳ Generating...' : '✨ Generate Cover Letter (.docx)'}
                </button>
              </div>
            )}

            {activeTab === 'tracker' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                  <input type="text" placeholder="Job Title" value={newJob.title} onChange={(e) => setNewJob({...newJob, title: e.target.value})} style={{ padding: '0.75rem', border: '2px solid #fed7aa', borderRadius: '0.5rem' }} />
                  <input type="text" placeholder="Company" value={newJob.company} onChange={(e) => setNewJob({...newJob, company: e.target.value})} style={{ padding: '0.75rem', border: '2px solid #fed7aa', borderRadius: '0.5rem' }} />
                  <select value={newJob.status} onChange={(e) => setNewJob({...newJob, status: e.target.value})} style={{ padding: '0.75rem', border: '2px solid #fed7aa', borderRadius: '0.5rem' }}>
                    <option>Applied</option>
                    <option>Interview</option>
                    <option>Offer</option>
                    <option>Rejected</option>
                  </select>
                  <button onClick={addJob} style={{ padding: '0.75rem', background: '#f97316', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '500' }}>➕ Add</button>
                </div>

                {jobs.map(job => (
                  <div key={job.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#fef3c7', borderRadius: '0.5rem' }}>
                    <div>
                      <h3 style={{ fontWeight: '600' }}>{job.title}</h3>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{job.company}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: '600' }}>{job.status}</span>
                      <button onClick={() => deleteJob(job.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>🗑️</button>
                    </div>
                  </div>
                ))}

                <div style={{ background: '#dbeafe', padding: '1rem', borderRadius: '0.75rem' }}>
                  <h3 style={{ fontWeight: '600', marginBottom: '0.75rem' }}>🔍 Quick Job Search</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                    <a href="https://www.linkedin.com/jobs" target="_blank" rel="noopener noreferrer" style={{ padding: '0.75rem', background: '#3b82f6', color: 'white', textDecoration: 'none', textAlign: 'center', borderRadius: '0.5rem', fontWeight: '500' }}>LinkedIn</a>
                    <a href="https://www.indeed.com" target="_blank" rel="noopener noreferrer" style={{ padding: '0.75rem', background: '#6366f1', color: 'white', textDecoration: 'none', textAlign: 'center', borderRadius: '0.5rem', fontWeight: '500' }}>Indeed</a>
                    <a href="https://www.glassdoor.com" target="_blank" rel="noopener noreferrer" style={{ padding: '0.75rem', background: '#10b981', color: 'white', textDecoration: 'none', textAlign: 'center', borderRadius: '0.5rem', fontWeight: '500' }}>Glassdoor</a>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'interview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input type="text" placeholder="Job Role (e.g., Project Manager)" value={jobRole} onChange={(e) => setJobRole(e.target.value)} style={{ padding: '0.75rem', border: '2px solid #fed7aa', borderRadius: '0.5rem' }} />
                <textarea placeholder="Custom questions (one per line)" value={customQuestions} onChange={(e) => setCustomQuestions(e.target.value)} style={{ height: '6rem', padding: '0.75rem', border: '2px solid #fed7aa', borderRadius: '0.5rem' }} />
                <button onClick={handleGenerateQuestions} disabled={isGenerating} style={{ width: '100%', background: isGenerating ? '#9ca3af' : 'linear-gradient(to right, #f97316, #dc2626)', color: 'white', padding: '1rem', borderRadius: '0.75rem', fontWeight: '600', border: 'none', cursor: isGenerating ? 'not-allowed' : 'pointer' }}>
                  {isGenerating ? '⏳ Generating...' : '✨ Generate Questions'}
                </button>

                {generatedQuestions.length > 0 && (
                  <div style={{ background: '#fef3c7', padding: '1rem', borderRadius: '0.75rem', maxHeight: '20rem', overflowY: 'auto' }}>
                    <h3 style={{ fontWeight: '600', marginBottom: '0.75rem' }}>📋 Questions ({generatedQuestions.length})</h3>
                    {generatedQuestions.map((q, i) => (
                      <div key={i} style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid #fed7aa' }}>
                        <span style={{ fontSize: '0.75rem', color: '#f97316', fontWeight: '500' }}>{q.category}</span>
                        <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>{i + 1}. {q.question}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reminders' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: '#fef3c7', padding: '1.5rem', borderRadius: '0.75rem' }}>
                  <h3 style={{ fontWeight: '600', marginBottom: '1rem' }}>📅 Daily Reminder</h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} style={{ flex: 1, padding: '0.75rem', border: '2px solid #fed7aa', borderRadius: '0.5rem' }} />
                    <button onClick={enableReminder} disabled={reminderEnabled} style={{ padding: '0.75rem 1.5rem', background: reminderEnabled ? '#9ca3af' : '#f97316', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: reminderEnabled ? 'not-allowed' : 'pointer' }}>
                      {reminderEnabled ? '✅ Active' : '🔔 Enable'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'study' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: '#fef3c7', border: '2px solid #fed7aa', borderRadius: '0.75rem', padding: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Select Job</label>
                  <select value={selectedJobForStudy} onChange={(e) => setSelectedJobForStudy(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '2px solid #fed7aa', borderRadius: '0.5rem' }}>
                    <option value="">-- Select --</option>
                    {jobs.map(j => <option key={j.id} value={j.id}>{j.title} at {j.company}</option>)}
                  </select>
                </div>

                <button onClick={handleGenerateStudyGuide} disabled={isGenerating || !selectedJobForStudy} style={{ width: '100%', background: isGenerating || !selectedJobForStudy ? '#9ca3af' : 'linear-gradient(to right, #6366f1, #a855f7)', color: 'white', padding: '1rem', borderRadius: '0.75rem', fontWeight: '600', border: 'none', cursor: isGenerating || !selectedJobForStudy ? 'not-allowed' : 'pointer' }}>
                  {isGenerating ? '⏳ Generating...' : '✨ Generate Study Guide (.docx)'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
