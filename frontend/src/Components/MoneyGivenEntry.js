// MoneyGivenEntry.js
import React, { useState, useEffect } from 'react';
import './MoneyGivenEntry.css';

const MoneyGivenEntry = ({ onEntryAdded, onEntriesChange }) => {
  const [formData, setFormData] = useState({
    amount: '',
    recipient: '',
    reason: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    notes: '',
    paymentMethod: '',
    isRecurring: false,
    dueDate: ''
  });

  const [entries, setEntries] = useState([]);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [showForm, setShowForm] = useState(false);

  const categories = [
    'Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Bills & Utilities',
    'Healthcare', 'Education', 'Travel', 'Gifts', 'Charity', 'Investment', 'Loan Payment',
    'Rent', 'Groceries', 'Personal Care', 'Business Expense', 'Other'
  ];

  const paymentMethods = [
    'Cash', 'Bank Transfer', 'Check', 'Credit Card', 'Debit Card', 'Digital Wallet', 
    'Online Payment', 'Cryptocurrency', 'Other'
  ];

  useEffect(() => {
    const savedEntries = localStorage.getItem('moneyGivenEntries');
    if (savedEntries) {
      const parsedEntries = JSON.parse(savedEntries);
      setEntries(parsedEntries);
      onEntriesChange && onEntriesChange(parsedEntries);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('moneyGivenEntries', JSON.stringify(entries));
    onEntriesChange && onEntriesChange(entries);
  }, [entries]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.recipient || !formData.reason) {
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
      recipient: '',
      reason: '',
      date: new Date().toISOString().split('T')[0],
      category: '',
      notes: '',
      paymentMethod: '',
      isRecurring: false,
      dueDate: ''
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

  const getTotalGiven = () => {
    return entries.reduce((total, entry) => total + entry.amount, 0);
  };

  const getCategoryTotals = () => {
    const categoryTotals = {};
    entries.forEach(entry => {
      const category = entry.category || 'Other';
      categoryTotals[category] = (categoryTotals[category] || 0) + entry.amount;
    });
    return categoryTotals;
  };

  const getTopCategories = () => {
    const categoryTotals = getCategoryTotals();
    return Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
  };

  return (
    <div className="money-given-container">
      <div className="header-section">
        <h2>💸 Money Given</h2>
        <div className="summary-section">
          <div className="total-display">
            <span className="total-label">Total Given:</span>
            <span className="total-amount negative">${getTotalGiven().toFixed(2)}</span>
          </div>
          <div className="top-categories">
            <h4>Top Categories:</h4>
            {getTopCategories().map(([category, amount]) => (
              <div key={category} className="category-item">
                <span>{category}</span>
                <span className="category-amount">${amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
        <button 
          className="btn btn-primary add-entry-btn"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕ Cancel' : '+ Add Expense'}
        </button>
      </div>

      {showForm && (
        <div className="entry-form-container">
          <form onSubmit={handleSubmit} className="entry-form">
            <h3>{editingIndex >= 0 ? 'Edit Expense' : 'Add New Expense'}</h3>
            
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
                <label htmlFor="recipient">Recipient/Where *</label>
                <input
                  type="text"
                  id="recipient"
                  name="recipient"
                  value={formData.recipient}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Walmart, John Doe, Electric Company"
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
                <label htmlFor="reason">Reason/Purpose *</label>
                <input
                  type="text"
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Groceries, Gas, Movie tickets"
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

            <div className="form-row">
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isRecurring"
                    checked={formData.isRecurring}
                    onChange={handleInputChange}
                  />
                  <span className="checkmark"></span>
                  Recurring Expense
                </label>
              </div>

              {formData.isRecurring && (
                <div className="form-group">
                  <label htmlFor="dueDate">Next Due Date</label>
                  <input
                    type="date"
                    id="dueDate"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                  />
                </div>
              )}
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
                {editingIndex >= 0 ? 'Update Expense' : 'Add Expense'}
              </button>
              <button 
                type="button" 
                className="btn btn-ghost cancel-btn"
                onClick={() => {
                  setShowForm(false);
                  setEditingIndex(-1);
                  setFormData({
                    amount: '',
                    recipient: '',
                    reason: '',
                    date: new Date().toISOString().split('T')[0],
                    category: '',
                    notes: '',
                    paymentMethod: '',
                    isRecurring: false,
                    dueDate: ''
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
        <h3>Recent Expenses</h3>
        {entries.length === 0 ? (
          <div className="no-entries">
            <p>No expenses recorded yet. Add your first expense!</p>
          </div>
        ) : (
          <div className="entries-grid">
            {entries.map((entry, index) => (
              <div key={entry.id} className="entry-card">
                <div className="entry-header">
                  <div className="amount-section">
                    <span className="entry-amount negative">${entry.amount.toFixed(2)}</span>
                    {entry.isRecurring && <span className="recurring-badge">🔄</span>}
                  </div>
                  <span className="entry-date">{new Date(entry.date).toLocaleDateString()}</span>
                </div>
                
                <div className="entry-body">
                  <div className="entry-detail">
                    <strong>To:</strong> {entry.recipient}
                  </div>
                  <div className="entry-detail">
                    <strong>For:</strong> {entry.reason}
                  </div>
                  {entry.category && (
                    <div className="entry-detail">
                      <strong>Category:</strong> 
                      <span className="category-tag expense">{entry.category}</span>
                    </div>
                  )}
                  {entry.paymentMethod && (
                    <div className="entry-detail">
                      <strong>Method:</strong> {entry.paymentMethod}
                    </div>
                  )}
                  {entry.dueDate && entry.isRecurring && (
                    <div className="entry-detail">
                      <strong>Next Due:</strong> {new Date(entry.dueDate).toLocaleDateString()}
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

export default MoneyGivenEntry;