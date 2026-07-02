// LoanManagement.js - Complete Loan Management System
import React, { useState, useEffect } from 'react';
import './LoanManagement.css';

const LoanManagement = () => {
  const [loans, setLoans] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [formData, setFormData] = useState({
    borrowerName: '',
    amount: '',
    interestRate: '',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    description: '',
    status: 'active',
    paymentSchedule: 'monthly',
    collateral: '',
    contactInfo: '',
    paymentMethod: 'cash'
  });

  // Load loans from localStorage on component mount
  useEffect(() => {
    const savedLoans = localStorage.getItem('loanManagementData');
    if (savedLoans) {
      try {
        const parsedLoans = JSON.parse(savedLoans);
        setLoans(parsedLoans);
      } catch (error) {
        console.error('Error loading loans:', error);
      }
    }
  }, []);

  // Save loans to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('loanManagementData', JSON.stringify(loans));
  }, [loans]);

  // Calculate interest and loan details
  const calculateInterest = (principal, rate, days) => {
    const dailyRate = rate / 365 / 100;
    return principal * dailyRate * days;
  };

  const calculateLoanDetails = (loan) => {
    const startDate = new Date(loan.startDate);
    const currentDate = new Date();
    const dueDate = new Date(loan.dueDate);
    
    const daysPassed = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));
    const totalDays = Math.floor((dueDate - startDate) / (1000 * 60 * 60 * 24));
    
    const accruedInterest = calculateInterest(loan.amount, loan.interestRate, Math.max(0, daysPassed));
    const totalInterest = calculateInterest(loan.amount, loan.interestRate, Math.max(0, totalDays));
    const totalAmount = loan.amount + totalInterest;
    const currentAmount = loan.amount + accruedInterest;
    
    const isOverdue = currentDate > dueDate && loan.status === 'active';
    const daysOverdue = isOverdue ? Math.floor((currentDate - dueDate) / (1000 * 60 * 60 * 24)) : 0;
    
    // Calculate progress percentage
    const progressPercentage = totalDays > 0 ? (daysPassed / totalDays * 100) : 0;
    
    return {
      accruedInterest,
      totalInterest,
      totalAmount,
      currentAmount,
      isOverdue,
      daysOverdue,
      daysPassed,
      totalDays,
      progressPercentage: Math.min(100, Math.max(0, progressPercentage))
    };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.borrowerName || !formData.amount || !formData.interestRate || !formData.dueDate) {
      alert('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    const interestRate = parseFloat(formData.interestRate);

    if (amount <= 0 || interestRate < 0) {
      alert('Please enter valid positive numbers');
      return;
    }

    const loanData = {
      ...formData,
      amount: amount,
      interestRate: interestRate,
      id: editingIndex >= 0 ? loans[editingIndex].id : Date.now(),
      createdAt: editingIndex >= 0 ? loans[editingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (editingIndex >= 0) {
      const updatedLoans = [...loans];
      updatedLoans[editingIndex] = loanData;
      setLoans(updatedLoans);
      setEditingIndex(-1);
    } else {
      setLoans(prev => [loanData, ...prev]);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      borrowerName: '',
      amount: '',
      interestRate: '',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      description: '',
      status: 'active',
      paymentSchedule: 'monthly',
      collateral: '',
      contactInfo: '',
      paymentMethod: 'cash'
    });
    setShowForm(false);
  };

  const handleEdit = (index) => {
    setFormData(loans[index]);
    setEditingIndex(index);
    setShowForm(true);
  };

  const handleDelete = (index) => {
    if (window.confirm('Are you sure you want to delete this loan record? This action cannot be undone.')) {
      const updatedLoans = loans.filter((_, i) => i !== index);
      setLoans(updatedLoans);
    }
  };

  const updateLoanStatus = (index, newStatus) => {
    const updatedLoans = [...loans];
    updatedLoans[index].status = newStatus;
    if (newStatus === 'paid') {
      updatedLoans[index].paidDate = new Date().toISOString().split('T')[0];
      updatedLoans[index].paidAmount = calculateLoanDetails(updatedLoans[index]).totalAmount;
    }
    updatedLoans[index].updatedAt = new Date().toISOString();
    setLoans(updatedLoans);
  };

  const getTotalLoansValue = () => {
    return loans
      .filter(loan => loan.status === 'active')
      .reduce((total, loan) => {
        const details = calculateLoanDetails(loan);
        return total + details.totalAmount;
      }, 0);
  };

  const getOverdueLoans = () => {
    return loans.filter(loan => {
      const details = calculateLoanDetails(loan);
      return details.isOverdue;
    });
  };

  const getActiveLoansCount = () => {
    return loans.filter(loan => loan.status === 'active').length;
  };

  const getPaidLoansCount = () => {
    return loans.filter(loan => loan.status === 'paid').length;
  };

  const getTotalInterestEarned = () => {
    return loans
      .filter(loan => loan.status === 'paid')
      .reduce((total, loan) => {
        const details = calculateLoanDetails(loan);
        return total + details.totalInterest;
      }, 0);
  };

  return (
    <div className="loan-management-container">
      <div className="header-section">
        <div className="header-title">
          <h2>💰 Loan Management System</h2>
          <p className="subtitle">Track loans with automatic interest calculations</p>
        </div>
        
        <div className="loan-summary">
          <div className="summary-item active">
            <div className="summary-icon">📊</div>
            <div className="summary-content">
              <span className="summary-label">Active Loans</span>
              <span className="summary-value">{getActiveLoansCount()}</span>
            </div>
          </div>
          
          <div className="summary-item value">
            <div className="summary-icon">💵</div>
            <div className="summary-content">
              <span className="summary-label">Total Value</span>
              <span className="summary-value positive">
                ${getTotalLoansValue().toFixed(2)}
              </span>
            </div>
          </div>
          
          <div className="summary-item overdue">
            <div className="summary-icon">⚠️</div>
            <div className="summary-content">
              <span className="summary-label">Overdue</span>
              <span className="summary-value negative">
                {getOverdueLoans().length}
              </span>
            </div>
          </div>
          
          <div className="summary-item completed">
            <div className="summary-icon">✅</div>
            <div className="summary-content">
              <span className="summary-label">Completed</span>
              <span className="summary-value">{getPaidLoansCount()}</span>
            </div>
          </div>
        </div>
        
        <button 
          className="btn btn-primary add-loan-btn"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕ Cancel' : '+ Add Loan'}
        </button>
      </div>

      {showForm && (
        <div className="loan-form-container">
          <form onSubmit={handleSubmit} className="loan-form">
            <h3>{editingIndex >= 0 ? '✏️ Edit Loan' : '➕ Add New Loan'}</h3>
            
            <div className="form-section">
              <h4>📋 Borrower Information</h4>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="borrowerName">
                    Borrower Name *
                    <span className="required">Required</span>
                  </label>
                  <input
                    type="text"
                    id="borrowerName"
                    name="borrowerName"
                    value={formData.borrowerName}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter borrower's full name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contactInfo">Contact Information</label>
                  <input
                    type="text"
                    id="contactInfo"
                    name="contactInfo"
                    value={formData.contactInfo}
                    onChange={handleInputChange}
                    placeholder="Phone, email, or address"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4>💵 Loan Details</h4>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="amount">
                    Loan Amount ($) *
                    <span className="required">Required</span>
                  </label>
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
                  <label htmlFor="interestRate">
                    Interest Rate (% per year) *
                    <span className="required">Required</span>
                  </label>
                  <input
                    type="number"
                    id="interestRate"
                    name="interestRate"
                    value={formData.interestRate}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    required
                    placeholder="5.00"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="paymentSchedule">Payment Schedule</label>
                  <select
                    id="paymentSchedule"
                    name="paymentSchedule"
                    value={formData.paymentSchedule}
                    onChange={handleInputChange}
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                    <option value="lump-sum">Lump Sum</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="paymentMethod">Payment Method</label>
                  <select
                    id="paymentMethod"
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                  >
                    <option value="cash">Cash</option>
                    <option value="bank-transfer">Bank Transfer</option>
                    <option value="check">Check</option>
                    <option value="online">Online Payment</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4>📅 Timeline</h4>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startDate">Start Date</label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="dueDate">
                    Due Date *
                    <span className="required">Required</span>
                  </label>
                  <input
                    type="date"
                    id="dueDate"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4>📝 Additional Information</h4>
              
              <div className="form-group full-width">
                <label htmlFor="collateral">Collateral (if any)</label>
                <input
                  type="text"
                  id="collateral"
                  name="collateral"
                  value={formData.collateral}
                  onChange={handleInputChange}
                  placeholder="Description of collateral or security"
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="description">Description/Notes</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Additional notes about the loan (purpose, terms, etc.)"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary submit-btn">
                {editingIndex >= 0 ? '💾 Update Loan' : '➕ Add Loan'}
              </button>
              <button type="button" className="btn btn-ghost cancel-btn" onClick={resetForm}>
                ✕ Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="loans-list">
        <div className="list-header">
          <h3>📋 Loan Records</h3>
          <div className="filter-buttons">
            <button className="btn btn-ghost filter-btn active">All</button>
            <button className="btn btn-ghost filter-btn">Active</button>
            <button className="btn btn-ghost filter-btn">Overdue</button>
            <button className="btn btn-ghost filter-btn">Paid</button>
          </div>
        </div>

        {loans.length === 0 ? (
          <div className="no-loans">
            <div className="no-loans-icon">📄</div>
            <h3>No Loan Records Yet</h3>
            <p>Click "Add Loan" to create your first loan record and start tracking!</p>
          </div>
        ) : (
          <div className="loans-grid">
            {loans.map((loan, index) => {
              const details = calculateLoanDetails(loan);
              return (
                <div 
                  key={loan.id} 
                  className={`loan-card status-${loan.status} ${details.isOverdue ? 'overdue' : ''}`}
                >
                  {/* Loan Header */}
                  <div className="loan-header">
                    <div className="borrower-info">
                      <div className="borrower-avatar">
                        {loan.borrowerName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4>{loan.borrowerName}</h4>
                        <span className={`status-badge ${loan.status}`}>
                          {loan.status === 'active' && '🔵 Active'}
                          {loan.status === 'paid' && '✅ Paid'}
                          {loan.status === 'defaulted' && '❌ Defaulted'}
                        </span>
                      </div>
                    </div>
                    <div className="loan-amount-header">
                      <span className="amount-label">Principal</span>
                      <span className="amount-value">${loan.amount.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {loan.status === 'active' && (
                    <div className="loan-progress">
                      <div className="progress-info">
                        <span>Progress: {details.progressPercentage.toFixed(0)}%</span>
                        <span>
                          {details.daysPassed} / {details.totalDays} days
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ '--progress-width': `${details.progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Loan Details Grid */}
                  <div className="loan-details-grid">
                    <div className="detail-item">
                      <span className="detail-icon">📊</span>
                      <div>
                        <span className="detail-label">Interest Rate</span>
                        <span className="detail-value">{loan.interestRate}% /year</span>
                      </div>
                    </div>

                    <div className="detail-item">
                      <span className="detail-icon">📅</span>
                      <div>
                        <span className="detail-label">Start Date</span>
                        <span className="detail-value">
                          {new Date(loan.startDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="detail-item">
                      <span className="detail-icon">⏰</span>
                      <div>
                        <span className="detail-label">Due Date</span>
                        <span className={`detail-value ${details.isOverdue ? 'overdue-text' : ''}`}>
                          {new Date(loan.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="detail-item">
                      <span className="detail-icon">💰</span>
                      <div>
                        <span className="detail-label">Payment Schedule</span>
                        <span className="detail-value">
                          {loan.paymentSchedule.charAt(0).toUpperCase() + loan.paymentSchedule.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Interest Calculation */}
                  <div className="interest-section">
                    <div className="interest-item">
                      <span>Accrued Interest:</span>
                      <span className="interest-amount">
                        +${details.accruedInterest.toFixed(2)}
                      </span>
                    </div>
                    <div className="interest-item">
                      <span>Total Interest:</span>
                      <span className="interest-amount">
                        +${details.totalInterest.toFixed(2)}
                      </span>
                    </div>
                    <div className="interest-item total">
                      <span><strong>Current Amount Due:</strong></span>
                      <span className="total-amount">
                        <strong>${details.currentAmount.toFixed(2)}</strong>
                      </span>
                    </div>
                    <div className="interest-item total">
                      <span><strong>Total at Maturity:</strong></span>
                      <span className="total-amount">
                        <strong>${details.totalAmount.toFixed(2)}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Overdue Warning */}
                  {details.isOverdue && (
                    <div className="overdue-notice">
                      <span className="overdue-icon">⚠️</span>
                      <div>
                        <strong>Overdue by {details.daysOverdue} days</strong>
                        <p>Additional interest continues to accrue daily</p>
                      </div>
                    </div>
                  )}

                  {/* Additional Info */}
                  {(loan.contactInfo || loan.collateral || loan.description) && (
                    <div className="additional-info">
                      {loan.contactInfo && (
                        <div className="info-item">
                          <strong>📞 Contact:</strong> {loan.contactInfo}
                        </div>
                      )}
                      {loan.collateral && (
                        <div className="info-item">
                          <strong>🔒 Collateral:</strong> {loan.collateral}
                        </div>
                      )}
                      {loan.description && (
                        <div className="info-item">
                          <strong>📝 Notes:</strong> {loan.description}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Loan Actions */}
                  <div className="loan-actions">
                    {loan.status === 'active' && (
                      <div className="status-actions">
                        <button 
                          className="btn action-btn paid"
                          onClick={() => updateLoanStatus(index, 'paid')}
                          title="Mark as Paid"
                        >
                          ✅ Mark Paid
                        </button>
                        <button 
                          className="btn action-btn defaulted"
                          onClick={() => updateLoanStatus(index, 'defaulted')}
                          title="Mark as Defaulted"
                        >
                          ❌ Default
                        </button>
                      </div>
                    )}
                    
                    <div className="edit-delete-actions">
                      <button 
                        className="btn action-btn edit"
                        onClick={() => handleEdit(index)}
                        title="Edit Loan"
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        className="btn action-btn delete"
                        onClick={() => handleDelete(index)}
                        title="Delete Loan"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>

                  {/* Paid Status */}
                  {loan.status === 'paid' && loan.paidDate && (
                    <div className="paid-status">
                      <span className="paid-icon">✅</span>
                      <span>Paid on {new Date(loan.paidDate).toLocaleDateString()}</span>
                      <span className="paid-amount">
                        Amount: ${loan.paidAmount?.toFixed(2) || details.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Statistics Section */}
      {loans.length > 0 && (
        <div className="statistics-section">
          <h3>📈 Statistics</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">💵</div>
              <div className="stat-content">
                <span className="stat-label">Total Lent</span>
                <span className="stat-value">
                  ${loans.reduce((sum, loan) => sum + loan.amount, 0).toFixed(2)}
                </span>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <span className="stat-label">Interest Earned</span>
                <span className="stat-value positive">
                  ${getTotalInterestEarned().toFixed(2)}
                </span>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <span className="stat-label">Average Interest Rate</span>
                <span className="stat-value">
                  {(loans.reduce((sum, loan) => sum + loan.interestRate, 0) / loans.length).toFixed(2)}%
                </span>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">⏱️</div>
              <div className="stat-content">
                <span className="stat-label">Average Duration</span>
                <span className="stat-value">
                  {Math.round(loans.reduce((sum, loan) => {
                    const days = Math.floor((new Date(loan.dueDate) - new Date(loan.startDate)) / (1000 * 60 * 60 * 24));
                    return sum + days;
                  }, 0) / loans.length)} days
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanManagement;