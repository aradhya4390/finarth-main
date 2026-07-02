// DailyExpenses.js
import React, { useState, useEffect } from 'react';
import './DailyExpenses.css';

const DailyExpenses = () => {
  const [quickAmount, setQuickAmount] = useState('');
  const [quickCategory, setQuickCategory] = useState('');
  const [quickDescription, setQuickDescription] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [filter, setFilter] = useState('today');

  const quickCategories = [
    { name: 'Food', icon: '🍔', color: '#ff6b6b' },
    { name: 'Transport', icon: '🚗', color: '#4ecdc4' },
    { name: 'Coffee', icon: '☕', color: '#45b7d1' },
    { name: 'Shopping', icon: '🛒', color: '#f9ca24' },
    { name: 'Bills', icon: '💡', color: '#ff7675' },
    { name: 'Other', icon: '📝', color: '#6c5ce7' }
  ];

  useEffect(() => {
    const savedExpenses = localStorage.getItem('dailyExpenses');
    if (savedExpenses) {
      setExpenses(JSON.parse(savedExpenses));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('dailyExpenses', JSON.stringify(expenses));
  }, [expenses]);

  const addQuickExpense = (amount, category, description = '') => {
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const expense = {
      id: Date.now(),
      amount: parseFloat(amount),
      category: category || 'Other',
      description: description || `${category || 'Other'} expense`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0],
      timestamp: new Date().toISOString()
    };

    setExpenses(prev => [expense, ...prev]);
    setQuickAmount('');
    setQuickDescription('');
  };

  const deleteExpense = (id) => {
    if (window.confirm('Delete this expense?')) {
      setExpenses(prev => prev.filter(exp => exp.id !== id));
    }
  };

  const getFilteredExpenses = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    switch (filter) {
      case 'today':
        return expenses.filter(exp => exp.date === today);
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        return expenses.filter(exp => exp.date >= weekAgo);
      case 'month':
        const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        return expenses.filter(exp => exp.date >= monthAgo);
      default:
        return expenses;
    }
  };

  const getTotalForPeriod = () => {
    return getFilteredExpenses().reduce((total, exp) => total + exp.amount, 0);
  };

  const getCategoryBreakdown = () => {
    const filtered = getFilteredExpenses();
    const breakdown = {};
    
    filtered.forEach(exp => {
      breakdown[exp.category] = (breakdown[exp.category] || 0) + exp.amount;
    });
    
    return Object.entries(breakdown)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  };

  const getQuickStats = () => {
    const filtered = getFilteredExpenses();
    if (filtered.length === 0) return { avg: 0, highest: 0, count: 0 };
    
    const total = filtered.reduce((sum, exp) => sum + exp.amount, 0);
    const highest = Math.max(...filtered.map(exp => exp.amount));
    
    return {
      avg: total / filtered.length,
      highest,
      count: filtered.length
    };
  };

  const stats = getQuickStats();

  return (
    <div className="daily-expenses-container">
      <div className="header-section">
        <h2>⚡ Daily Expenses Quick Entry</h2>
        <div className="period-filter">
          <button 
            className={filter === 'today' ? 'active' : ''}
            onClick={() => setFilter('today')}
          >
            Today
          </button>
          <button 
            className={filter === 'week' ? 'active' : ''}
            onClick={() => setFilter('week')}
          >
            This Week
          </button>
          <button 
            className={filter === 'month' ? 'active' : ''}
            onClick={() => setFilter('month')}
          >
            This Month
          </button>
          <button 
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Quick Entry Section */}
      <div className="quick-entry-section">
        <div className="amount-input-container">
          <div className="currency-symbol">$</div>
          <input
            type="number"
            value={quickAmount}
            onChange={(e) => setQuickAmount(e.target.value)}
            placeholder="Enter amount"
            className="amount-input"
            step="0.01"
            min="0"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && quickAmount) {
                addQuickExpense(quickAmount, quickCategory, quickDescription);
              }
            }}
          />
        </div>

        <input
          type="text"
          value={quickDescription}
          onChange={(e) => setQuickDescription(e.target.value)}
          placeholder="What was it for? (optional)"
          className="description-input"
          onKeyPress={(e) => {
            if (e.key === 'Enter' && quickAmount) {
              addQuickExpense(quickAmount, quickCategory, quickDescription);
            }
          }}
        />

        <div className="quick-categories">
          {quickCategories.map(cat => (
            <button
              key={cat.name}
              className={`category-btn ${quickCategory === cat.name ? 'selected' : ''}`}
              style={{ '--cat-color': cat.color }}
              onClick={() => {
                setQuickCategory(cat.name);
                if (quickAmount) {
                  addQuickExpense(quickAmount, cat.name, quickDescription);
                }
              }}
            >
              <span className="category-icon">{cat.icon}</span>
              <span className="category-name">{cat.name}</span>
            </button>
          ))}
        </div>

        <button 
          className="btn btn-primary add-expense-btn"
          onClick={() => addQuickExpense(quickAmount, quickCategory, quickDescription)}
          disabled={!quickAmount}
        >
          💰 Add Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card total">
          <h3>Total Spent</h3>
          <div className="amount">${getTotalForPeriod().toFixed(2)}</div>
          <small>{filter === 'today' ? 'Today' : filter === 'week' ? 'This Week' : filter === 'month' ? 'This Month' : 'All Time'}</small>
        </div>
        
        <div className="summary-card average">
          <h3>Average</h3>
          <div className="amount">${stats.avg.toFixed(2)}</div>
          <small>Per transaction</small>
        </div>
        
        <div className="summary-card highest">
          <h3>Highest</h3>
          <div className="amount">${stats.highest.toFixed(2)}</div>
          <small>Single expense</small>
        </div>
        
        <div className="summary-card count">
          <h3>Transactions</h3>
          <div className="amount">{stats.count}</div>
          <small>Total count</small>
        </div>
      </div>

      {/* Category Breakdown */}
      {getCategoryBreakdown().length > 0 && (
        <div className="category-breakdown">
          <h3>💰 Spending by Category</h3>
          <div className="category-list">
            {getCategoryBreakdown().map(({ category, amount }) => {
              const categoryData = quickCategories.find(c => c.name === category) || 
                                 { icon: '📝', color: '#6c5ce7' };
              const percentage = getTotalForPeriod() > 0 
                ? ((amount / getTotalForPeriod()) * 100).toFixed(1) 
                : 0;
              
              return (
                <div key={category} className="category-breakdown-item">
                  <div className="category-info">
                    <span className="category-icon">{categoryData.icon}</span>
                    <span className="category-name">{category}</span>
                  </div>
                  <div className="category-stats">
                      <div className="category-bar">
                      <div 
                        className="category-fill"
                        style={{ '--fill-width': `${percentage}%`, '--cat-color': categoryData.color }}
                      ></div>
                    </div>
                    <span className="category-amount">${amount.toFixed(2)}</span>
                    <span className="category-percentage">{percentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Expenses List */}
      <div className="expenses-list">
        <h3>📋 Recent Expenses</h3>
        {getFilteredExpenses().length === 0 ? (
          <div className="no-expenses">
            <p>No expenses recorded for this period.</p>
            <p>Use the quick entry above to add your first expense!</p>
          </div>
        ) : (
          <div className="expenses-timeline">
            {getFilteredExpenses().slice(0, 20).map(expense => {
              const categoryData = quickCategories.find(c => c.name === expense.category) || 
                                 { icon: '📝', color: '#6c5ce7' };
              
              return (
                <div key={expense.id} className="expense-item">
                  <div className="expense-time">
                    <div className="time">{expense.time.slice(0, 5)}</div>
                    <div className="date">{new Date(expense.date).toLocaleDateString()}</div>
                  </div>
                  
                  <div 
                    className="expense-category-icon"
                    style={{ '--cat-color': categoryData.color }}
                  >
                    {categoryData.icon}
                  </div>
                  
                  <div className="expense-details">
                    <div className="expense-description">{expense.description}</div>
                    <div className="expense-category">{expense.category}</div>
                  </div>
                  
                  <div className="expense-amount">${expense.amount.toFixed(2)}</div>
                  
                  <button 
                    className="delete-expense-btn"
                    onClick={() => deleteExpense(expense.id)}
                    title="Delete expense"
                  >
                    ×
                  </button>
                </div>
              );
            })}
            
            {getFilteredExpenses().length > 20 && (
              <div className="more-expenses">
                <p>Showing recent 20 expenses out of {getFilteredExpenses().length} total</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Presets for Common Amounts */}
      <div className="quick-presets">
        <h4>Quick Amounts</h4>
        <div className="preset-buttons">
          {[5, 10, 15, 25, 50, 100].map(amount => (
            <button 
              key={amount}
              className="btn preset-btn"
              onClick={() => setQuickAmount(amount.toString())}
            >
              ${amount}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DailyExpenses;