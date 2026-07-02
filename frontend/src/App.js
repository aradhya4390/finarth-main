// App.js - Complete Self-Contained Finance Application
import React, { useState, useEffect, useContext, useRef } from 'react';
// Logout icon replaced by lucide-react LogOut; keeping assets import removed
import './App.css';
import finarthLogoLight from './assets/finarth-icon.svg';
// The dark sidebar logo can be placed in `public/assets/sidebar logo dark theme.png`.
// Using a runtime public path avoids compile errors when the file is not present
// in `src/assets`. If you prefer a static import, put the file into
// `frontend/src/assets` and I'll switch back to a static import.

import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './Components/Login.jsx';
import Signup from './Components/Signup.jsx';
import { AuthContext } from './contexts/AuthContext';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import * as api from './utils/api';
import { Bell, Home, DollarSign, CreditCard, Banknote, Zap, Target, BarChart2, Settings as LucideSettings, LogOut, Menu } from 'lucide-react';

function symbolFromCode(code) {
  switch ((code || '').toUpperCase()) {
    case 'INR': return '₹';
    case 'USD': return '$';
    case 'EUR': return '€';
    case 'GBP': return '£';
    default: return code || '$';
  }
}

// currency formatting helper (symbol only, numeric kept as-is)
function formatCurrency(amount, symbol) {
  const n = Number(amount) || 0;
  const abs = Math.abs(n).toFixed(2);
  return (n < 0 ? '-' : '') + (symbol || '$') + abs;
}
// const sidebarLogoDarkPath = process.env.PUBLIC_URL + '/assets/darklogo.png';

// WelcomePage Component
const WelcomePage = ({ onEnterApp }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleEnterApp = () => {
    setIsAnimating(true);
    setTimeout(() => {
      onEnterApp();
    }, 800);
  };

  return (
    <div className={`welcome-container ${isAnimating ? 'fade-out' : ''}`}>
      <div className="welcome-content">
        <div className="welcome-logo-section">
          <div className="welcome-logo"></div>
          <h1 className="welcome-title">Finarth</h1>
          <p className="welcome-subtitle">Your Complete Personal Finance Management Solution</p>
        </div>

        <button onClick={handleEnterApp} className="welcome-button">
          Enter Application →
        </button>
      </div>
    </div>
  );
};

// FileUploadAnalysis Component
const FileUploadAnalysis = ({ onDataExtracted }) => {
  const [dragActive, setDragActive] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [manualText, setManualText] = useState('');
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  // utility to extract numbers (amounts) from text
  const extractNumbersFromText = (text) => {
    const matches = text.match(/-?\d{1,3}(?:[,\d]{0,})?\.?\d*/g) || [];
    // normalize and parse
    const nums = matches
      .map(s => s.replace(/,/g, ''))
      .map(s => parseFloat(s))
      .filter(n => !Number.isNaN(n) && n !== 0);
    return nums;
  };

  

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
      // reset input so same file can be selected again if needed
      e.target.value = '';
    }
  };

  const handleFile = async (file) => {
    setLoading(true);
    setAnalysisResult(null); // clear previous results

    // Try server-side upload & analysis first (preferred). If it fails (401 or parsing error), fall back to client-side heuristics.
    try {
      const form = new FormData();
      form.append('file', file);
      try {
        const res = await api.uploadFileAnalysis(form);
        // backend responds with { message: 'Analysis created', analysis }
        const serverAnalysis = res && res.analysis;
        if (serverAnalysis && Array.isArray(serverAnalysis.extractedData) && serverAnalysis.extractedData.length) {
          // try to normalize extracted rows into transaction-like objects
          const transactions = serverAnalysis.extractedData.map((r, idx) => {
            const vals = Object.values(r || {});
            // find first numeric-like value
            let amt = null;
            for (const v of vals) {
              if (v == null) continue;
              const s = String(v).replace(/[,$\s]/g, '');
              const m = s.match(/-?\d+(?:\.\d+)?/);
              if (m) { amt = Number(m[0]); break; }
            }
            if (amt === null) amt = 0;
            return {
              id: r.id || `${Date.now()}-${idx}`,
              amount: amt,
              description: r.description || r.desc || vals[0] || 'Imported',
              category: r.category || '',
              date: r.date || new Date().toISOString().split('T')[0],
              timestamp: r.timestamp || new Date().toISOString()
            };
          });

          const analysis = { transactions, summary: serverAnalysis.summary || {} };
          setAnalysisResult(analysis);
          onDataExtracted && onDataExtracted(analysis);
          setLoading(false);
          return;
        }
      } catch (serverErr) {
        // server-side upload failed (likely 401 or parse error). We'll fall back to client parsing below.
        console.warn('Server analysis failed, falling back to client parsing:', serverErr && serverErr.message ? serverErr.message : serverErr);
      }

      // If server did not return analyzable data, fall back to client-side parsing
      const name = (file.name || '').toLowerCase();
      const ext = name.split('.').pop();
      let rawText = '';

      if (ext === 'txt' || ext === 'csv' || ext === 'json') {
        rawText = await file.text();
      } else if (ext === 'docx') {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          rawText = result.value || '';
        } catch (err) { rawText = ''; }
      } else if (ext === 'xlsx' || ext === 'xls') {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          let combined = '';
          workbook.SheetNames.forEach((s) => {
            const sheet = XLSX.utils.sheet_to_csv(workbook.Sheets[s]);
            combined += '\n' + sheet;
          });
          rawText = combined;
        } catch (err) { rawText = ''; }
      } else {
        rawText = '';
      }

      const numbers = extractNumbersFromText(rawText + '\n' + manualText);
      if (!numbers || numbers.length === 0) {
        showToast('Invalid file or no readable financial data found in this file.');
        setLoading(false);
        return;
      }

      const transactions = numbers.map((num, idx) => {
        const amount = Math.abs(num);
        const isIncome = num > 0 && idx === 0 && idx < 2;
        return isIncome
          ? { amount: amount, description: 'Imported Income', category: 'Imported', type: 'income', date: new Date().toISOString().split('T')[0] }
          : { amount: -amount, description: 'Imported Expense', category: 'Imported', type: 'expense', date: new Date().toISOString().split('T')[0] };
      });

      const totalIncome = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
      const totalExpenses = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
      const summary = { totalIncome, totalExpenses, netAmount: totalIncome - totalExpenses, transactionCount: transactions.length };

      const analysis = { transactions, summary };
      setAnalysisResult(analysis);
      onDataExtracted && onDataExtracted(analysis);
    } catch (err) {
      console.error('File analysis error', err);
      showToast('Failed to analyze file.');
    } finally {
      setLoading(false);
    }
  };

  const analyzeText = () => {
    if (!manualText.trim()) return;

    setLoading(true);
    const amounts = extractNumbersFromText(manualText) || [];
    if (amounts.length === 0) {
      showToast('No numeric data found in the text.');
      setLoading(false);
      return;
    }

    const transactions = amounts.map((amount, index) => ({
      amount: amount > 0 ? amount : -Math.abs(amount),
      description: `Text entry ${index + 1}`,
      category: 'Other',
      type: amount > 0 ? 'income' : 'expense',
      date: new Date().toISOString().split('T')[0]
    }));

    const analysis = {
      transactions,
      summary: {
        totalIncome: transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0),
        totalExpenses: transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0),
        netAmount: transactions.reduce((s, t) => s + t.amount, 0),
        transactionCount: transactions.length
      }
    };

    setAnalysisResult(analysis);
    onDataExtracted && onDataExtracted(analysis);
    setLoading(false);
  };

  return (
    <div className="component-card">
      <h2>File Upload & Analysis</h2>

      <div 
        className={`upload-area ${dragActive ? 'active' : ''}`}
        onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
          <div className="upload-icon" aria-hidden></div>
        <p>Drag & drop your files here</p>
        <p className="upload-formats">Supports: Excel (.xlsx/.xls), Word (.docx), Text/CSV</p>
        <input 
          ref={fileInputRef}
          type="file" 
          onChange={handleFileInput}
          className="file-input-hidden"
          id="file-input"
          accept=".pdf,.xlsx,.xls,.docx,.txt,.csv,.json"
        />
        <label htmlFor="file-input" className="primary-button">
          Choose File
        </label>
      </div>

      <div className="manual-section">
        <h3>Or Enter Text Manually</h3>
        <textarea
          value={manualText}
          onChange={(e) => setManualText(e.target.value)}
          placeholder="Enter your financial data or text to analyze..."
          rows="4"
          className="textarea-input"
        />
        <button onClick={analyzeText} className="primary-button">
          Analyze Text
        </button>
      </div>

      {loading && (
        <div className="loading-panel">
          <div className="spinner"></div>
          <p>Processing your file...</p>
        </div>
      )}

      {toast && (
        <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.9)', borderRadius: 8, border: '1px solid var(--card-border)' }}>
          {toast}
        </div>
      )}

      {analysisResult && (
        <div style={componentStyles.results}>
          <h3>Analysis Results</h3>
          <div style={componentStyles.summaryCards}>
            <div style={componentStyles.summaryCard}>
              <h4>Total Income</h4>
              <p>${analysisResult.summary.totalIncome.toFixed(2)}</p>
            </div>
            <div style={componentStyles.summaryCard}>
              <h4>Total Expenses</h4>
              <p>${analysisResult.summary.totalExpenses.toFixed(2)}</p>
            </div>
            <div style={componentStyles.summaryCard}>
              <h4>Net Amount</h4>
              <p style={{ color: analysisResult.summary.netAmount >= 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
                ${analysisResult.summary.netAmount.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// MoneyReceivedEntry Component
const MoneyReceivedEntry = ({ onEntriesChange, entries: propEntries, currencySymbol = '₹' }) => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    amount: '',
    source: '',
    reason: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Salary'
  });
  const storageKey = `moneyReceivedEntries_${user?.email || 'guest'}`;
  const [entries, setEntries] = useState(() => {
    if (propEntries && Array.isArray(propEntries)) return propEntries;
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    // sync prop-driven entries if parent provides them
    if (propEntries && Array.isArray(propEntries)) {
      setEntries(propEntries);
      onEntriesChange && onEntriesChange(propEntries);
      return;
    }
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setEntries(parsed);
        onEntriesChange && onEntriesChange(parsed);
      }
    } catch (e) {}
  }, [onEntriesChange, propEntries, storageKey]);

  // Persist and notify parent when entries change
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(entries)); } catch (e) {}
    onEntriesChange && onEntriesChange(entries);
  }, [entries, onEntriesChange, storageKey]);

  // If parent updates propEntries later, sync local state
  useEffect(() => {
    if (propEntries && Array.isArray(propEntries)) setEntries(propEntries);
  }, [propEntries]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.source || !formData.reason) {
      alert('Please fill all required fields');
      return;
    }

    const localEntry = {
      ...formData,
      amount: parseFloat(formData.amount),
      id: Date.now(),
      timestamp: new Date().toISOString()
    };

    // optimistic local update
    setEntries(prev => [localEntry, ...prev]);

    // try to persist to backend (if available). If it fails, keep local only
    try {
      const body = {
        title: formData.source,
        content: formData.reason,
        numericValue: Number(formData.amount),
        tags: [formData.category]
      };
      const created = await api.createEntryOnBackend(body).catch(() => null);
      if (created && created._id) {
        // replace local optimistic id with backend id
        setEntries(prev => prev.map(it => it.id === localEntry.id ? ({ ...it, id: created._id, timestamp: created.createdAt || it.timestamp }) : it));
      }
    } catch (err) {
      // ignore — offline/local fallback
    }

    try { localStorage.setItem(storageKey, JSON.stringify([localEntry, ...entries])); } catch (e) {}

    setFormData({
      amount: '',
      source: '',
      reason: '',
      date: new Date().toISOString().split('T')[0],
      category: 'Salary'
    });
    setShowForm(false);
  };

  const deleteEntry = (id) => {
    if (window.confirm('Delete this entry?')) {
      // attempt backend delete when id looks like a backend id
      (async () => {
        try {
          if (typeof id === 'string' && id.length > 8) await api.deleteEntryOnBackend(id).catch(() => null);
        } catch (e) {}
      })();
      setEntries(prev => prev.filter(entry => entry.id !== id));
    }
  };

  const totalReceived = entries.reduce((sum, entry) => sum + entry.amount, 0);

  return (
    <div className="component-card">
      <div className="component-header">
        <h2>Money Received</h2>
        <div className="total-display">
          Total: <span style={{ color: 'var(--success-color)', fontSize: '1.5rem' }}>{formatCurrency(totalReceived, currencySymbol)}</span>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="primary-button">
          {showForm ? 'Cancel' : '+ Add Entry'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="form-panel">
          <div className="form-row">
            <input
              type="number"
              placeholder="Amount"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              className="form-input"
              step="0.01"
              required
            />
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="form-input"
              required
            />
          </div>
          <div className="form-row">
            <input
              type="text"
              placeholder="Source (e.g., ABC Company)"
              value={formData.source}
              onChange={(e) => setFormData({...formData, source: e.target.value})}
              className="form-input"
              required
            />
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="form-input"
            >
              <option value="Salary">Salary</option>
              <option value="Freelance">Freelance</option>
              <option value="Investment">Investment</option>
              <option value="Gift">Gift</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <input
            type="text"
            placeholder="Reason (e.g., Monthly salary)"
            value={formData.reason}
            onChange={(e) => setFormData({...formData, reason: e.target.value})}
            className="form-input"
            required
          />
          <button type="submit" className="submit-button">Add Entry</button>
        </form>
      )}

      <div className="entries-list">
        {entries.length === 0 ? (
          <p className="no-entries">No entries yet. Add your first income entry!</p>
        ) : (
          entries.map(entry => (
            <div key={entry.id} className="entry-card">
              <div className="entry-header">
                <span style={{ color: 'var(--success-color)', fontSize: '1.2rem', fontWeight: 'bold' }}>
                  {formatCurrency(entry.amount, currencySymbol)}
                </span>
                <span style={{ color: 'var(--muted)' }}>{new Date(entry.date).toLocaleDateString()}</span>
              </div>
              <div><strong>From:</strong> {entry.source}</div>
              <div><strong>Reason:</strong> {entry.reason}</div>
              <div><strong>Category:</strong> {entry.category}</div>
              <button 
                onClick={() => deleteEntry(entry.id)}
                className="delete-button"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// MoneyGivenEntry Component
const MoneyGivenEntry = ({ onEntriesChange, entries: propEntries, currencySymbol = '₹' }) => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    amount: '',
    recipient: '',
    reason: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Food'
  });
  const storageKey = `moneyGivenEntries_${user?.email || 'guest'}`;
  const [entries, setEntries] = useState(() => {
    if (propEntries && Array.isArray(propEntries)) return propEntries;
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    // prefer parent-provided entries if present
    if (propEntries && Array.isArray(propEntries)) {
      setEntries(propEntries);
      onEntriesChange && onEntriesChange(propEntries);
      return;
    }
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setEntries(parsed);
        onEntriesChange && onEntriesChange(parsed);
      }
    } catch (e) {}
  }, [onEntriesChange, propEntries, storageKey]);

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(entries)); } catch (e) {}
    onEntriesChange && onEntriesChange(entries);
  }, [entries, onEntriesChange, storageKey]);

  useEffect(() => {
    if (propEntries && Array.isArray(propEntries)) setEntries(propEntries);
  }, [propEntries]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.recipient || !formData.reason) {
      alert('Please fill all required fields');
      return;
    }
    const localEntry = {
      ...formData,
      amount: parseFloat(formData.amount),
      id: Date.now(),
      timestamp: new Date().toISOString()
    };

    setEntries(prev => [localEntry, ...prev]);

    try {
      const body = {
        title: formData.recipient,
        content: formData.reason,
        numericValue: -Math.abs(Number(formData.amount)),
        tags: [formData.category]
      };
      const created = await api.createEntryOnBackend(body).catch(() => null);
      if (created && created._id) {
        setEntries(prev => prev.map(it => it.id === localEntry.id ? ({ ...it, id: created._id, timestamp: created.createdAt || it.timestamp }) : it));
      }
    } catch (err) {}

    try { localStorage.setItem(storageKey, JSON.stringify([localEntry, ...entries])); } catch (e) {}

    setFormData({
      amount: '',
      recipient: '',
      reason: '',
      date: new Date().toISOString().split('T')[0],
      category: 'Food'
    });
    setShowForm(false);
  };

  const deleteEntry = (id) => {
    if (window.confirm('Delete this entry?')) {
      (async () => {
        try {
          if (typeof id === 'string' && id.length > 8) await api.deleteEntryOnBackend(id).catch(() => null);
        } catch (e) {}
      })();
      setEntries(prev => prev.filter(entry => entry.id !== id));
    }
  };

  const totalGiven = entries.reduce((sum, entry) => sum + entry.amount, 0);

  return (
    <div className="component-card">
      <div className="component-header">
        <h2>Money Given</h2>
        <div className="total-display">
          Total: <span style={{ color: 'var(--danger-color)', fontSize: '1.5rem' }}>{formatCurrency(totalGiven, currencySymbol)}</span>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="primary-button">
          {showForm ? 'Cancel' : '+ Add Expense'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="form-panel">
          <div className="form-row">
            <input
              type="number"
              placeholder="Amount"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              className="form-input"
              step="0.01"
              required
            />
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="form-input"
              required
            />
          </div>
          <div className="form-row">
            <input
              type="text"
              placeholder="Recipient (e.g., Walmart, John)"
              value={formData.recipient}
              onChange={(e) => setFormData({...formData, recipient: e.target.value})}
              className="form-input"
              required
            />
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="form-input"
            >
              <option value="Food">Food</option>
              <option value="Transport">Transport</option>
              <option value="Shopping">Shopping</option>
              <option value="Bills">Bills</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <input
            type="text"
            placeholder="Reason (e.g., Groceries, Gas)"
            value={formData.reason}
            onChange={(e) => setFormData({...formData, reason: e.target.value})}
            style={componentStyles.input}
            required
          />
          <button type="submit" style={componentStyles.submitButton}>Add Expense</button>
        </form>
      )}

      <div style={componentStyles.entriesList}>
        {entries.length === 0 ? (
          <p style={componentStyles.noEntries}>No expenses yet. Add your first expense!</p>
        ) : (
          entries.map(entry => (
            <div key={entry.id} style={componentStyles.entryCard}>
              <div style={componentStyles.entryHeader}>
                <span style={{ color: 'var(--danger-color)', fontSize: '1.2rem', fontWeight: 'bold' }}>
                  {formatCurrency(entry.amount, currencySymbol)}
                </span>
                <span style={{ color: 'var(--muted)' }}>{new Date(entry.date).toLocaleDateString()}</span>
              </div>
              <div><strong>To:</strong> {entry.recipient}</div>
              <div><strong>For:</strong> {entry.reason}</div>
                  <div><strong>Category:</strong> {entry.category}</div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                    <button onClick={() => deleteEntry(entry.id)} className="delete-button" style={{ ...componentStyles.deleteButton, position: 'static' }} aria-label="Delete expense">Delete</button>
                  </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// SummaryDashboard Component
const SummaryDashboard = ({ receivedEntries = [], givenEntries = [], dailyExpenses = [], loans = [], currencySymbol = '₹', user = null, onGenerateAnalytics = null }) => {
  const totalReceived = receivedEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const totalGiven = givenEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const totalExpenses = dailyExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const netAmount = totalReceived - totalGiven - totalExpenses;

  return (
    <div style={componentStyles.container}>
      {user && (
        <div style={{ marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>{`Welcome${user.name ? `, ${user.name}` : ''}`}</h2>
          <p style={{ color: 'var(--muted)', marginTop: 6 }}>Here's a quick summary of your finances</p>
        </div>
      )}
      <h2 style={{ marginTop: user ? 8 : 0 }}>Financial Summary</h2>
      
      <div style={componentStyles.summaryGrid}>
    <div style={{...componentStyles.summaryCard, backgroundColor: 'var(--bg-positive)'}}>
          <h3>Total Received</h3>
      <div style={{ fontSize: '2rem', color: 'var(--success-color)' }}>{formatCurrency(totalReceived, currencySymbol)}</div>
          <small>{receivedEntries.length} transactions</small>
        </div>
        
  <div style={{...componentStyles.summaryCard, backgroundColor: 'var(--bg-negative)'}}>
          <h3>Total Given</h3>
      <div style={{ fontSize: '2rem', color: 'var(--danger-color)' }}>{formatCurrency(totalGiven, currencySymbol)}</div>
          <small>{givenEntries.length} transactions</small>
        </div>
        
  <div style={{...componentStyles.summaryCard, backgroundColor: netAmount >= 0 ? 'var(--bg-positive)' : 'var(--bg-negative)'}}>
          <h3>Net Amount</h3>
          <div style={{ fontSize: '2rem', color: netAmount >= 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
            {formatCurrency(netAmount, currencySymbol)}
          </div>
          <small>{netAmount >= 0 ? 'Profit' : 'Loss'}</small>
        </div>
      </div>

      

      <div style={componentStyles.recentSection}>
        <h3>Recent Transactions</h3>
        <div style={componentStyles.transactionsList}>
          {[...receivedEntries, ...givenEntries]
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 5)
            .map(entry => (
              <div key={entry.id} style={componentStyles.transactionItem}>
                <span style={{ color: entry.amount > 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
                  {formatCurrency(entry.amount, currencySymbol)}
                </span>
                <span>{entry.source || entry.recipient}</span>
                <span>{entry.reason}</span>
                <span>{new Date(entry.date).toLocaleDateString()}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

// Daily Expenses component
const DailyExpenses = ({ entries = [], setEntries, currencySymbol = '₹' }) => {
  const { user } = useContext(AuthContext);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], category: 'Other', description: '', amount: '' });

  const storageKey = `dailyExpensesEntries_${user?.email || 'guest'}`;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
      setEntries && setEntries(Array.isArray(saved) ? saved : []);
    } catch (e) {}
  }, [storageKey, setEntries]);

  const submit = async (e) => {
    e && e.preventDefault();
    if (!form.amount || !form.description) { alert('Please fill amount and description'); return; }
    const entry = { id: Date.now(), date: form.date, category: form.category, description: form.description, amount: Number(form.amount), timestamp: new Date().toISOString() };
    const newArr = [entry, ...entries];
    setEntries && setEntries(newArr);
    try { localStorage.setItem(storageKey, JSON.stringify(newArr)); } catch (e) {}
    // attempt backend persist (optional)
    try {
      await api.createEntryOnBackend({ title: entry.description, content: entry.category, numericValue: -Math.abs(entry.amount), tags: ['daily-expense'] }).catch(() => null);
    } catch (e) {}
    setForm({ date: new Date().toISOString().split('T')[0], category: 'Other', description: '', amount: '' });
  };

  const remove = (id) => {
    if (!window.confirm('Delete this expense?')) return;
    const filtered = entries.filter(x => x.id !== id);
    setEntries && setEntries(filtered);
    try { localStorage.setItem(storageKey, JSON.stringify(filtered)); } catch (e) {}
  };

  const total = (entries || []).reduce((s, e) => s + Number(e.amount || 0), 0);

  return (
    <div style={componentStyles.container}>
      <h2>Daily Expenses</h2>
      <form onSubmit={submit} className="form-panel">
        <div className="form-row">
          <input type="date" value={form.date} onChange={(e) => setForm(f => ({...f, date: e.target.value}))} className="form-input" />
          <select value={form.category} onChange={(e) => setForm(f => ({...f, category: e.target.value}))} className="form-input">
            <option>Food</option>
            <option>Transport</option>
            <option>Shopping</option>
            <option>Bills</option>
            <option>Other</option>
          </select>
        </div>
        <input type="text" placeholder="Description" value={form.description} onChange={(e) => setForm(f => ({...f, description: e.target.value}))} className="form-input" />
        <input type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm(f => ({...f, amount: e.target.value}))} className="form-input" step="0.01" />
        <button type="submit" className="submit-button">Add Expense</button>
      </form>

      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Expenses</h3>
          <div style={{ fontWeight: 700 }}>{formatCurrency(total, currencySymbol)}</div>
        </div>
        <div style={{ marginTop: 8 }}>
          {(entries || []).length === 0 ? <p className="no-entries">No expenses yet.</p> : (
            <div className="entry-grid">
              {(entries || []).map(en => (
                <div key={en.id} className="entry-card" style={componentStyles.entryCard}>
                  <div style={componentStyles.entryHeader}>
                    <div>{en.category}</div>
                    <div style={{ color: 'var(--muted)' }}>{new Date(en.date).toLocaleDateString()}</div>
                  </div>
                  <div><strong>{formatCurrency(en.amount, currencySymbol)}</strong></div>
                  <div>{en.description}</div>
                  <button onClick={() => remove(en.id)} className="delete-button">Delete</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Loan Management component
const LoanManagement = ({ loans = [], setLoans, currencySymbol = '₹' }) => {
  const { user } = useContext(AuthContext);
  const [form, setForm] = useState({ name: '', lender: '', principal: '', interest: '', startDate: new Date().toISOString().split('T')[0], dueDate: '', status: 'active' });
  const storageKey = `loanEntries_${user?.email || 'guest'}`;

  useEffect(() => {
    try { const saved = JSON.parse(localStorage.getItem(storageKey) || '[]'); setLoans && setLoans(Array.isArray(saved) ? saved : []); } catch (e) {}
  }, [storageKey, setLoans]);

  const submit = async (e) => {
    e && e.preventDefault();
    if (!form.name || !form.principal) { alert('Please enter loan name and principal'); return; }
    const item = { id: Date.now(), name: form.name, lender: form.lender, principal: Number(form.principal), interest: Number(form.interest || 0), startDate: form.startDate, dueDate: form.dueDate, status: form.status };
    const arr = [item, ...loans];
    setLoans && setLoans(arr);
    try { localStorage.setItem(storageKey, JSON.stringify(arr)); } catch (e) {}
    // optional backend persist
    try { await api.createEntryOnBackend({ title: item.name, content: item.lender, numericValue: Number(item.principal), tags: ['loan'] }).catch(() => null); } catch (e) {}
    setForm({ name: '', lender: '', principal: '', interest: '', startDate: new Date().toISOString().split('T')[0], dueDate: '', status: 'active' });
  };

  const remove = (id) => { if (!window.confirm('Delete this loan?')) return; const filtered = loans.filter(l => l.id !== id); setLoans && setLoans(filtered); try { localStorage.setItem(storageKey, JSON.stringify(filtered)); } catch (e) {} };

  const totalOutstanding = (loans || []).reduce((s, l) => s + (l.status !== 'paid' ? Number(l.principal || 0) : 0), 0);

  return (
    <div style={componentStyles.container}>
      <h2>Loan Management</h2>
      <form onSubmit={submit} className="form-panel">
        <input className="form-input" placeholder="Loan name" value={form.name} onChange={(e) => setForm(f => ({...f, name: e.target.value}))} />
        <div className="form-row">
          <input className="form-input" placeholder="Lender" value={form.lender} onChange={(e) => setForm(f => ({...f, lender: e.target.value}))} />
          <input className="form-input" placeholder="Principal" type="number" value={form.principal} onChange={(e) => setForm(f => ({...f, principal: e.target.value}))} />
        </div>
        <div className="form-row">
          <input className="form-input" placeholder="Interest (%)" type="number" value={form.interest} onChange={(e) => setForm(f => ({...f, interest: e.target.value}))} />
          <input className="form-input" type="date" value={form.startDate} onChange={(e) => setForm(f => ({...f, startDate: e.target.value}))} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="form-input" type="date" value={form.dueDate} onChange={(e) => setForm(f => ({...f, dueDate: e.target.value}))} />
          <select className="form-input" value={form.status} onChange={(e) => setForm(f => ({...f, status: e.target.value}))}>
            <option value="active">Active</option>
            <option value="paid">Paid</option>
          </select>
        </div>
        <button type="submit" className="submit-button">Add Loan</button>
      </form>

      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Loans</h3>
          <div style={{ fontWeight: 700 }}>{formatCurrency(totalOutstanding, currencySymbol)}</div>
        </div>
        {(loans || []).length === 0 ? <p className="no-entries">No loans yet.</p> : (
          <div className="entry-grid">
            {(loans || []).map(l => (
              <div key={l.id} className="entry-card" style={componentStyles.entryCard}>
                <div style={componentStyles.entryHeader}>
                  <div style={{ fontWeight: 700 }}>{l.name}</div>
                  <div style={{ color: 'var(--muted)' }}>{l.status}</div>
                </div>
                <div><strong>{formatCurrency(l.principal, currencySymbol)}</strong> — {l.lender}</div>
                <div>Interest: {l.interest}%</div>
                <div>Start: {l.startDate} • Due: {l.dueDate}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button onClick={() => remove(l.id)} className="delete-button">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
                                                                                                                          
const FinancialInsights = ({ receivedEntries = [], givenEntries = [] }) => {
  const totalIncome = receivedEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const totalExpenses = givenEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1) : 0;

  return (
    <div style={componentStyles.container}>
      <h2>Financial Insights</h2>
      <div style={componentStyles.insightsGrid}>
        <div style={componentStyles.insightCard}>
          <h3>Savings Rate</h3>
          <div style={{ fontSize: '2rem', color: savingsRate > 20 ? 'var(--success-color)' : 'var(--warning-color)' }}>
            {savingsRate}%
          </div>
          <p>{savingsRate > 20 ? 'Excellent!' : 'Room for improvement'}</p>
        </div>
        <div style={componentStyles.insightCard}>
          <h3>Financial Status</h3>
          <div style={{ fontSize: '1.5rem', color: totalIncome > totalExpenses ? 'var(--success-color)' : 'var(--danger-color)' }}>
            {totalIncome > totalExpenses ? 'Positive' : 'Negative'}
          </div>
          <p>{totalIncome > totalExpenses ? 'You\'re saving money!' : 'Review your expenses'}</p>
        </div>
      </div>
    </div>
  );
};

const SavingsTracker = ({ receivedEntries = [], givenEntries = [], dailyExpenses = [], loans = [], currencySymbol = '₹' }) => {
  const netSavings = receivedEntries.reduce((sum, entry) => sum + entry.amount, 0) - 
                   givenEntries.reduce((sum, entry) => sum + entry.amount, 0) -
                   dailyExpenses.reduce((s, e) => s + Number(e.amount || 0), 0) -
                   loans.reduce((s, l) => s + Number(l.amount || 0), 0);
  return (
      <div style={componentStyles.container}>
        <h2>Savings Tracker</h2>
      <div style={componentStyles.savingsStatus}>
        <h3>Current Status</h3>
        <div style={{ fontSize: '2rem', marginTop: 8 }}>{netSavings > 0 ? 'Profit' : netSavings < 0 ? 'Loss' : 'Neutral'}</div>
        <div style={{ fontSize: '1.5rem', color: netSavings >= 0 ? 'var(--success-color)' : 'var(--danger-color)', marginTop: 8 }}>{formatCurrency(netSavings, currencySymbol)}</div>
      </div>
    </div>
  );
};

const DataVisualization = ({ receivedEntries = [], givenEntries = [], onGenerateAnalytics = null }) => (
  <div style={componentStyles.container}>
    <h2>Data Visualization</h2>
    <p>Charts and graphs for your financial data</p>
    <div style={{ marginBottom: 12 }}>
      <button onClick={() => onGenerateAnalytics && onGenerateAnalytics()} className="primary-button">Generate Analytics Dashboard</button>
    </div>
    <div style={componentStyles.chartPlaceholder}>
      Interactive charts will be displayed here
    </div>
  </div>
);

const Settings = ({ currencyCode, setCurrencyCode, currencySymbol }) => {
  const { user, updateProfile } = useContext(AuthContext);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const onFileChange = async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(f);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const updates = { name, email };
      if (avatarPreview) updates.avatar = avatarPreview;
      if (password) updates.password = password;
      await updateProfile(updates);
      alert('Profile updated');
    } catch (err) {
      console.error('Profile update error:', err);
      const msg = err?.message || (err?.body && err.body.message) || (err?.response && err.response.data && err.response.data.message) || 'Failed to update profile';
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!newPassword) { alert('Enter a new password'); return; }
    if (newPassword !== confirmPassword) { alert('New password and confirm do not match'); return; }

    // attempt backend change first
    try {
      await api.changePasswordApi({ currentPassword, newPassword });
      alert('Password changed successfully');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      return;
    } catch (err) {
      // fallback to local storage users
    }

    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const idx = users.findIndex(u => u.email === user.email && u.password === currentPassword);
      if (idx === -1) { alert('Current password is incorrect'); return; }
      users[idx].password = newPassword;
      localStorage.setItem('users', JSON.stringify(users));
      alert('Password changed (local).');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (e) { alert('Failed to change password'); }
  };

  const clearAppData = () => {
    if (!window.confirm('Clear app data (received/given/reminders)?')) return;
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('moneyReceivedEntries_') || k.startsWith('moneyGivenEntries_') || k.includes('reminder_'));
      keys.forEach(k => localStorage.removeItem(k));
      window.location.reload();
    } catch (e) {}
  };
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div style={componentStyles.container}>
      <h2>⚙️ Settings</h2>
      {/* Dark Mode option removed - kept layout intact */}

      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'grid', gap: 8 }}>
          <button onClick={() => setEditOpen(s => !s)} className="settings-toggle" style={{ width: '100%', justifyContent: 'space-between' }} aria-expanded={editOpen} aria-controls="edit-profile-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <strong>Edit Profile</strong>
            </div>
            <div>{editOpen ? '▲' : '▼'}</div>
          </button>

          {editOpen && (
            <div style={{ display: 'grid', gap: 8 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: 999, overflow: 'hidden', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {avatarPreview ? <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ padding: 8 }}>{user?.name ? user.name[0] : 'F'}</div>}
                </div>
                <div>
                  <input type="file" accept="image/*" onChange={onFileChange} />
                </div>
              </div>

              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Full name" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} className="form-input" placeholder="Email address" type="email" />
              <input value={password} onChange={(e) => setPassword(e.target.value)} className="form-input" placeholder="New password (leave blank to keep)" type="password" />
              <div style={{ marginTop: 8 }}>
                <h4 style={{ margin: '6px 0' }}>Security / Password</h4>
                <input value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="form-input" placeholder="Current password" type="password" />
                <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="form-input" placeholder="New password" type="password" />
                <input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="form-input" placeholder="Confirm new password" type="password" />
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  <button onClick={changePassword} className="btn btn-primary">Change Password</button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={saveProfile} disabled={saving} className="btn btn-primary">{saving ? 'Saving...' : 'Save Profile'}</button>
                <button onClick={clearAppData} className="btn btn-ghost">Clear App Data</button>
              </div>
            </div>
          )}

          {/* Currency selector - visible in both themes */}
          <div style={{ marginTop: 12 }}>
            <h3>Currency</h3>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
              <select value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value)} className="form-input" style={{ maxWidth: 220 }}>
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
              <div style={{ color: 'var(--muted)' }}>Selected symbol: <strong style={{ marginLeft: 6 }}>{currencySymbol}</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


// Main application UI (kept as MainApp so we can expose /login and /signup routes)
const MainApp = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [receivedEntries, setReceivedEntries] = useState([]);
  const [givenEntries, setGivenEntries] = useState([]);
  const [dailyExpenses, setDailyExpenses] = useState([]);
  const [loans, setLoans] = useState([]);
  // Dark mode removed from the app; UI stays in light/default theme.
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();

  // currency per-user (default INR)
  const [currencyCode, setCurrencyCode] = useState('INR');

  useEffect(() => {
    try {
      const key = `currency_${user?.email || 'guest'}`;
      const stored = localStorage.getItem(key);
      if (stored) setCurrencyCode(stored);
      else {
        setCurrencyCode('INR');
        localStorage.setItem(key, 'INR');
      }
    } catch (e) {}
  }, [user?.email]);

  useEffect(() => {
    try {
      const key = `currency_${user?.email || 'guest'}`;
      if (currencyCode) localStorage.setItem(key, currencyCode);
    } catch (e) {}
  }, [currencyCode, user?.email]);

  const currencySymbol = symbolFromCode(currencyCode);

  // Reminder UI + settings
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderSettings, setReminderSettings] = useState({ enabled: false, time: '21:00' });

  const reminderStorageKey = `reminder_${user?.email || 'guest'}`;

  useEffect(() => {
    // load reminder prefs
    try {
      const saved = localStorage.getItem(reminderStorageKey);
      if (saved) setReminderSettings(JSON.parse(saved));
    } catch (e) {}
  }, [reminderStorageKey]);

  useEffect(() => {
    try { localStorage.setItem(reminderStorageKey, JSON.stringify(reminderSettings)); } catch (e) {}
  }, [reminderSettings, reminderStorageKey]);

  // On mount, load per-user entries from storage so data persists
  useEffect(() => {
    try {
      const recvKey = `moneyReceivedEntries_${user?.email || 'guest'}`;
      const givenKey = `moneyGivenEntries_${user?.email || 'guest'}`;
      const dailyKey = `dailyExpensesEntries_${user?.email || 'guest'}`;
      const loanKey = `loanEntries_${user?.email || 'guest'}`;
      const r = JSON.parse(localStorage.getItem(recvKey) || '[]');
      const g = JSON.parse(localStorage.getItem(givenKey) || '[]');
      const d = JSON.parse(localStorage.getItem(dailyKey) || '[]');
      const l = JSON.parse(localStorage.getItem(loanKey) || '[]');
      setReceivedEntries(Array.isArray(r) ? r : []);
      setGivenEntries(Array.isArray(g) ? g : []);
      setDailyExpenses(Array.isArray(d) ? d : []);
      setLoans(Array.isArray(l) ? l : []);
    } catch (e) { }
  }, [user?.email]);

  // Check reminders when app is active — if reminder is enabled and time has passed and
  // the user hasn't added an entry for today, show an in-app notification.
  useEffect(() => {
    if (!user) return;
    if (!reminderSettings?.enabled) return;

    const now = new Date();
    const targetParts = (reminderSettings.time || '21:00').split(':');
    const targetDate = new Date();
    targetDate.setHours(parseInt(targetParts[0] || '21', 10));
    targetDate.setMinutes(parseInt(targetParts[1] || '0', 10));
    targetDate.setSeconds(0);

    const lastNotifiedKey = `${reminderStorageKey}_lastNotified`;
    const lastNotified = localStorage.getItem(lastNotifiedKey);
    const today = new Date().toISOString().split('T')[0];

    const hasEntryToday = () => {
      const recvKey = `moneyReceivedEntries_${user.email}`;
      const givenKey = `moneyGivenEntries_${user.email}`;
      try {
        const r = JSON.parse(localStorage.getItem(recvKey) || '[]');
        const g = JSON.parse(localStorage.getItem(givenKey) || '[]');
        const all = [...(r || []), ...(g || [])];
        return all.some(e => (e.date || e.timestamp || '').startsWith ? (e.date || e.timestamp || '').startsWith(today) : (e.date || '').startsWith(today));
      } catch (e) { return false; }
    };

    if (now >= targetDate && lastNotified !== today && !hasEntryToday()) {
      // show simple alert / in-app notification
      try { window.alert(`Reminder: please add today's financial entry (${reminderSettings.time})`); } catch (e) {}
      localStorage.setItem(lastNotifiedKey, today);
    }
  }, [reminderSettings, user, reminderStorageKey]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigationItems = [
    { id: 'dashboard', name: 'Dashboard', icon: <Home size={16} /> },
    { id: 'money-given', name: 'Money Given', icon: <CreditCard size={16} /> },
    { id: 'money-received', name: 'Money Received', icon: <DollarSign size={16} /> },
    { id: 'daily-expenses', name: 'Daily Expenses', icon: <Zap size={16} /> },
    { id: 'loan-management', name: 'Loan Management', icon: <Banknote size={16} /> },
    { id: 'savings-tracker', name: 'Savings Tracker', icon: <Target size={16} /> },
    { id: 'data-visualization', name: 'Charts & Graphs', icon: <BarChart2 size={16} /> },
    { id: 'settings', name: 'Settings', icon: <LucideSettings size={16} /> }
  ];

  const handleEnterApp = () => setCurrentPage('dashboard');

  // When file analysis yields transactions, split into received/given and save
  const handleDataExtracted = (analysis) => {
    if (!analysis || !Array.isArray(analysis.transactions)) return;
    const txns = analysis.transactions;
    const incomes = txns.filter(t => t.amount > 0).map(t => ({
      id: t.id || Date.now() + Math.floor(Math.random()*1000),
      amount: Number(t.amount),
      source: t.description || t.source || 'Imported',
      reason: t.category || t.description || '',
      date: t.date || new Date().toISOString().split('T')[0],
      category: t.category || 'Imported',
      timestamp: t.timestamp || new Date().toISOString()
    }));

    const expenses = txns.filter(t => t.amount <= 0).map(t => ({
      id: t.id || Date.now() + Math.floor(Math.random()*1000),
      amount: Math.abs(Number(t.amount)),
      recipient: t.description || t.recipient || 'Imported',
      reason: t.category || t.description || '',
      date: t.date || new Date().toISOString().split('T')[0],
      category: t.category || 'Imported',
      timestamp: t.timestamp || new Date().toISOString()
    }));

    // Prepend new items so recent ones appear first
    if (incomes.length) setReceivedEntries(prev => [...incomes, ...prev]);
    if (expenses.length) setGivenEntries(prev => [...expenses, ...prev]);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'welcome':
        return <WelcomePage onEnterApp={handleEnterApp} />;
      case 'dashboard':
        return <SummaryDashboard receivedEntries={receivedEntries} givenEntries={givenEntries} dailyExpenses={dailyExpenses} loans={loans} currencySymbol={currencySymbol} user={user} onGenerateAnalytics={() => { setCurrentPage('analytics-dashboard'); navigate('/analytics-dashboard'); }} />;
      case 'file-upload':
        return <FileUploadAnalysis onDataExtracted={handleDataExtracted} />;
      case 'money-received':
        return <MoneyReceivedEntry onEntriesChange={setReceivedEntries} entries={receivedEntries} currencySymbol={currencySymbol} />;
      case 'money-given':
        return <MoneyGivenEntry onEntriesChange={setGivenEntries} entries={givenEntries} currencySymbol={currencySymbol} />;
      case 'loan-management':
        return <LoanManagement loans={loans} setLoans={setLoans} currencySymbol={currencySymbol} />;
      case 'daily-expenses':
        return <DailyExpenses entries={dailyExpenses} setEntries={setDailyExpenses} currencySymbol={currencySymbol} />;
      case 'financial-insights':
        return <FinancialInsights receivedEntries={receivedEntries} givenEntries={givenEntries} dailyExpenses={dailyExpenses} loans={loans} currencySymbol={currencySymbol} />;
      case 'savings-tracker':
        return <SavingsTracker receivedEntries={receivedEntries} givenEntries={givenEntries} dailyExpenses={dailyExpenses} loans={loans} currencySymbol={currencySymbol} />;
      case 'data-visualization':
        return <DataVisualization receivedEntries={receivedEntries} givenEntries={givenEntries} dailyExpenses={dailyExpenses} loans={loans} currencySymbol={currencySymbol} />;
      case 'settings':
        return <Settings currencyCode={currencyCode} setCurrencyCode={setCurrencyCode} currencySymbol={currencySymbol} />;
      default:
        return <WelcomePage onEnterApp={handleEnterApp} />;
    }
  };

  // Start on the dashboard by default. The welcome page can still be
  // navigated to explicitly through the navigation if desired.

  // keep body class in sync so CSS rules using `.dark` or `body.dark-mode` work
  // darkMode removed: no localStorage sync required

  return (
    <div className={`app-container`} style={{...appStyles.container, '--sidebar-width': sidebarOpen ? '280px' : '70px'}}>

      {/* Global Header (fixed) */}
      <header className="top-header app-header" style={{ ...appStyles.header }}>
        <div className="left-group">
          <div className="logo-container">
            <img src={finarthLogoLight} alt="Finarth" className="header-logo-img" />
             {/* <img src={finarthLogoDark} alt="Finarth" className="header-logo-img" /> */}
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={appStyles.toggleButton} aria-label="Toggle sidebar" title="Toggle sidebar" className="toggle-button">
            <Menu size={18} />
          </button>
        </div>

        <div className="right-group">
          <div style={{ position: 'relative' }}>
            <button onClick={() => setReminderOpen(!reminderOpen)} className="icon-button" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 8 }} title="Reminders" aria-label="Reminders">
              <Bell color="currentColor" size={20} aria-hidden />
            </button>
            {reminderOpen && (
              <div style={{ position: 'absolute', right: 0, top: '130%', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 8, padding: 12, width: 260, boxShadow: '0 6px 18px rgba(0,0,0,0.08)' }}>
                <h4 style={{ margin: 0, marginBottom: 8 }}>Daily Reminder</h4>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 8 }}>
                  <input type="checkbox" checked={reminderSettings.enabled} onChange={(e) => setReminderSettings(s => ({ ...s, enabled: e.target.checked }))} /> Enable reminder
                </label>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 8 }}>Time
                  <input type="time" value={reminderSettings.time} onChange={(e) => setReminderSettings(s => ({ ...s, time: e.target.value }))} style={{ width: '100%', marginTop: 6 }} />
                </label>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button onClick={() => setReminderOpen(false)} className="btn btn-ghost">Close</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

  {/* Sidebar */}
  <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`} style={{ ...appStyles.sidebar }}>
    <div className="sidebar-header">
      <div className="sidebar-profile">
        {user?.avatar ? (
          <img src={user.avatar} alt="avatar" className="avatar" />
        ) : (
          <div className="avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 20 }}>
            {user?.name ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('') : 'F'}
          </div>
        )}
        {sidebarOpen && <div className="name">{user?.name || ''}</div>}
      </div>
    </div>

    <div className="sidebar-body">
      <nav className="sidebar-nav" style={appStyles.nav}>
        <div className="nav-list">
          {navigationItems.map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
              style={{
                ...appStyles.navItem,
                ...(currentPage === item.id ? appStyles.navItemActive : {})
              }}
            >
              <span className="nav-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</span>
              {sidebarOpen && <span className="nav-text">{item.name}</span>}
            </button>
          ))}
        </div>
      </nav>

      <div className="sidebar-footer">
        <button
          onClick={handleLogout}
          className={`logout-button ${!sidebarOpen ? 'collapsed' : ''}`}
          title={!sidebarOpen ? 'Logout' : ''}
          aria-label="Logout"
        >
          <LogOut color="white" size={18} />
          {sidebarOpen && <span className="logout-text">Logout</span>}
        </button>
      </div>
    </div>
  </div>

      {/* Main Content */}
      <div className="main-content" style={{...appStyles.mainContent, marginTop: 'var(--header-height)'}}>
        <main className="page-content" style={appStyles.pageContent}>
          {renderCurrentPage()}
        </main>
      </div>
    </div>
  );
};
export default function App() {
  const { user } = useContext(AuthContext);

  return (
    <Routes>
      <Route
        path="/"
        element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/login"
        element={!user ? <Login /> : <Navigate to="/dashboard" replace />}
      />
      <Route
        path="/signup"
        element={!user ? <Signup /> : <Navigate to="/dashboard" replace />}
      />
      <Route path="/dashboard" element={user ? <MainApp /> : <Navigate to="/login" replace />} />
      <Route path="/*" element={user ? <MainApp /> : <Navigate to="/login" replace />} />
    </Routes>
  );
}

// Styles
/* welcomeStyles removed: usage moved to CSS classes in App.css. */

const componentStyles = {
  container: {
    background: 'var(--card-bg)',
    borderRadius: '12px',
    padding: '2rem',
    margin: '1rem 0',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem'
  },
  totalDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'var(--card-bg)',
    padding: '0.8rem 1.5rem',
    borderRadius: '25px',
    border: '1px solid var(--card-border)'
  },
  button: {
    background: 'var(--primary-gradient)',
    color: 'white',
    border: 'none',
    padding: '0.8rem 1.5rem',
    borderRadius: '25px',
    cursor: 'pointer',
    fontWeight: '600'
  },
  form: {
    background: 'var(--card-bg)',
    padding: '2rem',
    borderRadius: '12px',
    marginBottom: '2rem'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    marginBottom: '1rem'
  },
  input: {
    padding: '0.8rem',
    border: '1px solid var(--input-border)',
    borderRadius: '6px',
    fontSize: '1rem'
  },
  submitButton: {
    background: 'linear-gradient(45deg, var(--success-color), #20c997)',
    color: 'white',
    border: 'none',
    padding: '0.8rem 1.5rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    width: '100%'
  },
  entriesList: {
    display: 'grid',
    gap: '1rem'
  },
  entryCard: {
    background: 'var(--card-bg)',
    padding: '1.5rem',
    borderRadius: '10px',
    border: '1px solid var(--card-border)',
    position: 'relative'
  },
  entryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem'
  },
  deleteButton: {
    background: 'var(--danger-color)',
    color: 'white',
    border: 'none',
    padding: '0.4rem 0.9rem',
    borderRadius: '6px',
    cursor: 'pointer',
    marginTop: '8px',
    alignSelf: 'flex-end'
  },
  noEntries: {
    textAlign: 'center',
    padding: '3rem',
    color: 'var(--muted)',
    background: 'var(--card-bg)',
    border: '1px solid var(--card-border)',
    borderRadius: '12px'
  },
  uploadArea: {
    border: '2px dashed var(--card-border)',
    borderRadius: '12px',
    padding: '3rem 2rem',
    textAlign: 'center',
    background: 'var(--card-bg)',
    marginBottom: '2rem'
  },
  uploadAreaActive: {
    borderColor: 'var(--success-color)',
    background: 'var(--bg-positive)'
  },
  uploadIcon: {
    fontSize: '3rem',
    marginBottom: '1rem',
    opacity: 0.6
  },
  uploadFormats: {
    color: 'var(--muted)',
    fontSize: '0.9rem',
    margin: '0.5rem 0'
  },
  manualSection: {
    background: 'var(--card-bg)',
    padding: '1.5rem',
    borderRadius: '10px',
    marginBottom: '2rem'
  },
  textarea: {
    width: '100%',
    padding: '1rem',
    border: '1px solid #ddd',
    borderRadius: '8px',
    resize: 'vertical',
    marginBottom: '1rem'
  },
  loading: {
    textAlign: 'center',
    padding: '2rem'
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid rgba(0,0,0,0.06)',
    borderTop: '4px solid var(--success-color)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 1rem'
  },
  results: {
    background: 'var(--card-bg)',
    padding: '1.5rem',
    borderRadius: '10px'
  },
  summaryCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginTop: '1rem'
  },
  summaryCard: {
    padding: '1.5rem',
    borderRadius: '10px',
    textAlign: 'center',
    border: '1px solid var(--card-border)'
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem'
  },
  recentSection: {
    marginTop: '2rem'
  },
  transactionsList: {
    background: 'var(--card-bg)',
    borderRadius: '10px',
    padding: '1rem'
  },
  transactionItem: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr 1fr auto',
    gap: '1rem',
    padding: '0.8rem',
    borderBottom: '1px solid var(--card-border)',
    alignItems: 'center'
  },
  insightsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem'
  },
  insightCard: {
    background: 'var(--card-bg)',
    padding: '1.5rem',
    borderRadius: '10px',
    textAlign: 'center',
    border: '1px solid var(--card-border)'
  },
  savingsStatus: {
    textAlign: 'center',
    background: 'var(--card-bg)',
    padding: '2rem',
    borderRadius: '12px'
  },
  chartPlaceholder: {
    background: 'var(--card-bg)',
    padding: '4rem',
    textAlign: 'center',
    borderRadius: '12px',
    border: '2px dashed rgba(0,0,0,0.06)',
    fontSize: '1.2rem',
    color: 'var(--muted)'
  },
  comingSoon: {
    background: 'var(--warning-color)',
    color: '#856404',
    padding: '2rem',
    textAlign: 'center',
    borderRadius: '10px',
    border: '1px solid rgba(0,0,0,0.04)',
    fontSize: '1.1rem'
  },
  settingItem: {
    marginBottom: '1rem',
    padding: '1rem',
    background: 'var(--card-bg)',
    borderRadius: '8px'
  }
};

const appStyles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    background: 'var(--page-bg)'
  },
  dark: {
    background: '#1a1a2e',
    color: '#eee'
  },
  sidebar: {
    background: 'var(--sidebar-bg, linear-gradient(180deg, #667eea 0%, #764ba2 100%))',
    color: 'white',
    transition: 'all 0.3s ease',
    zIndex: 1000,
    overflowY: 'auto',
    overflowX: 'hidden'
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.8rem'
  },
  logoIcon: {
    fontSize: '2rem'
  },
  toggleButton: {
    background: 'rgba(255, 255, 255, 0.12)',
    border: 'none',
    color: 'var(--icon-color)',
    padding: '0.5rem',
    borderRadius: '50%',
    cursor: 'pointer'
  },
  nav: {
    padding: '1rem 0'
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.8rem',
    width: '100%',
    padding: '1rem 1.5rem',
    background: 'none',
    border: 'none',
    color: 'white',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '0.95rem'
  },
  navItemActive: {
    background: 'rgba(255, 255, 255, 0.2)',
    borderRight: '4px solid white'
  },
  mainContent: {
    flex: 1,
    transition: 'all 0.3s ease',
    minHeight: '100vh'
  },
  header: {
    background: 'var(--header-bg)',
    height: 'var(--header-height)',
    boxShadow: '0 2px 10px rgba(0,0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  stats: {
    display: 'flex',
    gap: '2rem'
  },
  pageContent: {
    padding: '2rem',
    background: 'var(--page-bg)',
    paddingTop: '80px',
    minHeight: 'calc(100vh - 80px)'
  }
};

