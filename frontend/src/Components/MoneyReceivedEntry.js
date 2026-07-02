// MoneyReceivedEntry.js
import React, { useState, useEffect } from 'react';
import './MoneyReceivedEntry.css';

const MoneyReceivedEntry = ({ onEntryAdded, onEntriesChange }) => {
  const [formData, setFormData] = useState({
    amount: '',
    source: '',
    reason: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    notes: '',
    paymentMethod: ''
  });

  const [entries, setEntries] = useState([]);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [showForm, setShowForm] = useState(false);

  const categories = [
    'Salary', 'Freelance', 'Investment', 'Gift', 'Refund', 'Bonus', 'Commission', 
    'Rental Income', 'Business Income', 'Side Hustle', 'Interest', 'Dividend', 'Other'
  ];

  const paymentMethods = [
    'Cash', 'Bank Transfer', 'Check', 'Credit Card', 'Digital Wallet', 
    'Online Payment', 'Cryptocurrency', 'Other'
  ];

  useEffect(() => {
    const savedEntries = localStorage.getItem('moneyReceivedEntries');
    if (savedEntries) {
      const parsedEntries = JSON.parse(savedEntries);
      setEntries(parsedEntries);
      onEntriesChange && onEntriesChange(parsedEntries);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('moneyReceivedEntries', JSON.stringify(entries));
    onEntriesChange && onEntriesChange(entries);
  }, [entries]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.source || !formData.reason) {
      alert('Please fill in all required fields');
      return;
    }

    const entryData = {
      ...formData,
      amount: parseFloat(formData.amount),
      id: Date.now(),
      timestamp: new Date().toISOString()
    };

    if (editingIndex >= 0) {
      const updatedEntries = [...entries];
      updatedEntries[editingIndex] = { ...entryData, id: entries[editingIndex].id };
      setEntries(updatedEntries);
      setEditingIndex(-1);
    } else {
      setEntries(prev => [entryData, ...prev]);
    }

    setFormData({
      amount: '',
      source: '',
      reason: '',
      date: new Date().toISOString().split('T')[0],
      category: '',
      notes: '',
      paymentMethod: ''
    });

    setShowForm(false);
    onEntryAdded && onEntryAdded(entryData);
  };

  const handleEdit = (index) => {
    setFormData(entries[index]);
    setEditingIndex(index);
    setShowForm(true);
  };

  const handleDelete = (index) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      const updatedEntries = entries.filter((_, i) => i !== index);
      setEntries(updatedEntries);
    }
  };

  const getTotalReceived = () => {
    return entries.reduce((total, entry) => total + entry.amount, 0);
  };

  return (
    <div className="money-received-container">
      <div className="header-section">
        <h2>💰 Money Received</h2>
        <div className="total-display">
          <span className="total-label">Total Received:</span>
          <span className="total-amount positive">${getTotalReceived().toFixed(2)}</span>
        </div>
        <button 
          className="btn btn-primary add-entry-btn"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕ Cancel' : '+ Add Entry'}
        </button>
      </div>

      {showForm && (
        <div className="entry-form-container">
          <form onSubmit={handleSubmit} className="entry-form">
            <h3>{editingIndex >= 0 ? 'Edit Entry' : 'Add New Entry'}</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="amount">Amount *</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label htmlFor="date">Date</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="source">Source *</label>
                <input
                  type="text"
                  id="source"
                  name="source"
                  value={formData.source}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., ABC Company, John Doe, Investment Account"
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="reason">Reason *</label>
                <input
                  type="text"
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Monthly salary, Freelance project, Gift"
                />
              </div>

              <div className="form-group">
                <label htmlFor="paymentMethod">Payment Method</label>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                >
                  <option value="">Select Method</option>
                  {paymentMethods.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group full-width">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows="3"
                placeholder="Additional notes or details..."
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary submit-btn">
                {editingIndex >= 0 ? 'Update Entry' : 'Add Entry'}
              </button>
              <button 
                type="button" 
                className="btn btn-ghost cancel-btn"
                onClick={() => {
                  setShowForm(false);
                  setEditingIndex(-1);
                  setFormData({
                    amount: '',
                    source: '',
                    reason: '',
                    date: new Date().toISOString().split('T')[0],
                    category: '',
                    notes: '',
                    paymentMethod: ''
                  });
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="entries-list">
        <h3>Recent Entries</h3>
        {entries.length === 0 ? (
          <div className="no-entries">
            <p>No entries yet. Add your first money received entry!</p>
          </div>
        ) : (
          <div className="entries-grid">
            {entries.map((entry, index) => (
              <div key={entry.id} className="entry-card">
                <div className="entry-header">
                  <span className="entry-amount positive">${entry.amount.toFixed(2)}</span>
                  <span className="entry-date">{new Date(entry.date).toLocaleDateString()}</span>
                </div>
                
                <div className="entry-body">
                  <div className="entry-detail">
                    <strong>From:</strong> {entry.source}
                  </div>
                  <div className="entry-detail">
                    <strong>Reason:</strong> {entry.reason}
                  </div>
                  {entry.category && (
                    <div className="entry-detail">
                      <strong>Category:</strong> 
                      <span className="category-tag">{entry.category}</span>
                    </div>
                  )}
                  {entry.paymentMethod && (
                    <div className="entry-detail">
                      <strong>Method:</strong> {entry.paymentMethod}
                    </div>
                  )}
                  {entry.notes && (
                    <div className="entry-detail notes">
                      <strong>Notes:</strong> {entry.notes}
                    </div>
                  )}
                </div>

                <div className="entry-actions">
                  <button 
                    className="btn edit-btn"
                    onClick={() => handleEdit(index)}
                    title="Edit Entry"
                  >
                    ✏️
                  </button>
                  <button 
                    className="btn delete-btn"
                    onClick={() => handleDelete(index)}
                    title="Delete Entry"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MoneyReceivedEntry;