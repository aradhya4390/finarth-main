// FinancialInsights.js
import React, { useState, useEffect } from 'react';
import './FinancialInsights.css';

const FinancialInsights = ({ receivedEntries = [], givenEntries = [] }) => {
  const [insights, setInsights] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [spendingPattern, setSpendingPattern] = useState('');

  useEffect(() => {
    analyzeFinancialData();
  }, [receivedEntries, givenEntries]);

  const analyzeFinancialData = () => {
    const totalIncome = receivedEntries.reduce((sum, entry) => sum + entry.amount, 0);
    const totalExpenses = givenEntries.reduce((sum, entry) => sum + entry.amount, 0);
    const netAmount = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netAmount / totalIncome) * 100 : 0;

    // Analyze spending by category
    const categorySpending = {};
    givenEntries.forEach(entry => {
      const category = entry.category || 'Other';
      categorySpending[category] = (categorySpending[category] || 0) + entry.amount;
    });

    // Find highest spending category
    const topCategory = Object.entries(categorySpending)
      .sort(([,a], [,b]) => b - a)[0];

    // Analyze spending trends
    const monthlySpending = analyzeMonthlyTrends();
    const averageMonthlySpending = monthlySpending.length > 0 
      ? monthlySpending.reduce((sum, month) => sum + month.amount, 0) / monthlySpending.length 
      : 0;

    // Generate insights
    const newInsights = [
      {
        id: 'savings-rate',
        icon: '💰',
        title: 'Savings Rate',
        value: `${savingsRate.toFixed(1)}%`,
        description: getSavingsRateDescription(savingsRate),
        type: savingsRate > 20 ? 'positive' : savingsRate > 10 ? 'warning' : 'negative'
      },
      {
        id: 'top-spending',
        icon: '📊',
        title: 'Top Spending Category',
        value: topCategory ? topCategory[0] : 'None',
        description: topCategory 
          ? `You spent $${topCategory[1].toFixed(2)} on ${topCategory[0]} this period`
          : 'No spending data available',
        type: 'info'
      },
      {
        id: 'monthly-average',
        icon: '📅',
        title: 'Monthly Average Spending',
        value: `$${averageMonthlySpending.toFixed(2)}`,
        description: getSpendingTrendDescription(monthlySpending),
        type: 'info'
      },
      {
        id: 'net-position',
        icon: netAmount >= 0 ? '📈' : '📉',
        title: 'Financial Position',
        value: `${netAmount.toFixed(2)}`,
        description: netAmount >= 0 
          ? 'You\'re in a positive financial position!' 
          : 'You\'re spending more than you earn',
        type: netAmount >= 0 ? 'positive' : 'negative'
      }
    ];

    setInsights(newInsights);

    // Generate recommendations
    const newRecommendations = generateRecommendations(
      totalIncome, 
      totalExpenses, 
      savingsRate, 
      categorySpending
    );
    setRecommendations(newRecommendations);

    // Set spending pattern
    setSpendingPattern(analyzeSpendingPattern(categorySpending, totalExpenses));
  };

  const analyzeMonthlyTrends = () => {
    const monthlyData = {};
    
    givenEntries.forEach(entry => {
      const monthKey = new Date(entry.date).toISOString().slice(0, 7);
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + entry.amount;
    });

    return Object.entries(monthlyData)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Last 6 months
  };

  const getSavingsRateDescription = (rate) => {
    if (rate > 30) return 'Excellent! You\'re saving over 30% of your income.';
    if (rate > 20) return 'Great job! You\'re saving a healthy portion of your income.';
    if (rate > 10) return 'Good start, but consider increasing your savings rate.';
    if (rate > 0) return 'You\'re saving some money, but there\'s room for improvement.';
    return 'You\'re spending more than you earn. Time to review your budget!';
  };

  const getSpendingTrendDescription = (monthlyData) => {
    if (monthlyData.length < 2) return 'Need more data to analyze trends';
    
    const recent = monthlyData.slice(-2);
    const trend = recent[1].amount - recent[0].amount;
    
    if (trend > 0) return `Spending increased by ${trend.toFixed(2)} last month`;
    if (trend < 0) return `Spending decreased by ${Math.abs(trend).toFixed(2)} last month`;
    return 'Spending remained stable last month';
  };

  const analyzeSpendingPattern = (categorySpending, totalExpenses) => {
    const sortedCategories = Object.entries(categorySpending)
      .sort(([,a], [,b]) => b - a);
    
    if (sortedCategories.length === 0) return 'balanced';
    
    const topCategoryPercentage = (sortedCategories[0][1] / totalExpenses) * 100;
    
    if (topCategoryPercentage > 50) return 'concentrated';
    if (topCategoryPercentage > 30) return 'focused';
    return 'balanced';
  };

  const generateRecommendations = (income, expenses, savingsRate, categorySpending) => {
    const recommendations = [];

    // Savings recommendations
    if (savingsRate < 10) {
      recommendations.push({
        id: 'increase-savings',
        icon: '💡',
        title: 'Increase Your Savings Rate',
        description: 'Try to save at least 10-20% of your income. Start by reducing discretionary spending.',
        priority: 'high',
        action: 'Review your expenses and identify areas to cut back'
      });
    }

    // Category-based recommendations
    const sortedCategories = Object.entries(categorySpending)
      .sort(([,a], [,b]) => b - a);
    
    if (sortedCategories.length > 0) {
      const [topCategory, topAmount] = sortedCategories[0];
      const percentage = (topAmount / expenses) * 100;
      
      if (percentage > 40) {
        recommendations.push({
          id: 'reduce-top-category',
          icon: '📉',
          title: `Reduce ${topCategory} Spending`,
          description: `${topCategory} accounts for ${percentage.toFixed(1)}% of your spending. Consider ways to optimize this category.`,
          priority: 'medium',
          action: `Look for alternatives or negotiate better deals for ${topCategory}`
        });
      }
    }

    // Income recommendations
    if (income < expenses) {
      recommendations.push({
        id: 'increase-income',
        icon: '💼',
        title: 'Increase Your Income',
        description: 'Your expenses exceed your income. Consider additional income sources.',
        priority: 'high',
        action: 'Explore freelancing, side hustles, or career advancement opportunities'
      });
    }

    // Emergency fund recommendation
    const monthlyExpenses = expenses / 6; // Assuming 6 months of data
    if (savingsRate > 0 && savingsRate < 15) {
      recommendations.push({
        id: 'emergency-fund',
        icon: '🛡️',
        title: 'Build Emergency Fund',
        description: `Aim to save 3-6 months of expenses (${(monthlyExpenses * 3).toFixed(2)} - ${(monthlyExpenses * 6).toFixed(2)}) for emergencies.`,
        priority: 'medium',
        action: 'Set up automatic transfers to a separate savings account'
      });
    }

    return recommendations;
  };

  const getBudgetRecommendation = () => {
    const totalIncome = receivedEntries.reduce((sum, entry) => sum + entry.amount, 0);
    
    return {
      housing: (totalIncome * 0.30).toFixed(2),
      food: (totalIncome * 0.15).toFixed(2),
      transportation: (totalIncome * 0.15).toFixed(2),
      entertainment: (totalIncome * 0.10).toFixed(2),
      savings: (totalIncome * 0.20).toFixed(2),
      other: (totalIncome * 0.10).toFixed(2)
    };
  };

  const budgetRecommendation = getBudgetRecommendation();

  return (
    <div className="financial-insights-container">
      <h2>💡 Financial Insights & Recommendations</h2>

      {/* Key Insights Cards */}
      <div className="insights-grid">
        {insights.map(insight => (
          <div key={insight.id} className={`insight-card ${insight.type}`}>
            <div className="insight-header">
              <span className="insight-icon">{insight.icon}</span>
              <div className="insight-title-value">
                <h3>{insight.title}</h3>
                <div className="insight-value">{insight.value}</div>
              </div>
            </div>
            <p className="insight-description">{insight.description}</p>
          </div>
        ))}
      </div>

      {/* Spending Pattern Analysis */}
      <div className="pattern-analysis">
        <h3>📊 Spending Pattern Analysis</h3>
        <div className="pattern-card">
          <div className="pattern-type">
            Your spending pattern: <strong>{spendingPattern}</strong>
          </div>
          <div className="pattern-description">
            {spendingPattern === 'concentrated' && 
              "Most of your spending is concentrated in one category. Consider diversifying or optimizing this area."
            }
            {spendingPattern === 'focused' && 
              "You have a primary spending category but maintain some balance across others."
            }
            {spendingPattern === 'balanced' && 
              "Your spending is well-distributed across different categories. Good job!"
            }
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="recommendations-section">
        <h3>🎯 Personalized Recommendations</h3>
        {recommendations.length === 0 ? (
          <div className="no-recommendations">
            <p>Great job! Your finances look healthy. Keep up the good work! 🎉</p>
          </div>
        ) : (
          <div className="recommendations-list">
            {recommendations.map(rec => (
              <div key={rec.id} className={`recommendation-card ${rec.priority}`}>
                <div className="rec-header">
                  <span className="rec-icon">{rec.icon}</span>
                  <h4>{rec.title}</h4>
                  <span className={`priority-badge ${rec.priority}`}>
                    {rec.priority}
                  </span>
                </div>
                <p className="rec-description">{rec.description}</p>
                <div className="rec-action">
                  <strong>Action:</strong> {rec.action}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Budget Recommendation */}
      <div className="budget-recommendation">
        <h3>💰 Suggested Budget Allocation</h3>
        <div className="budget-grid">
          <div className="budget-item">
            <span className="budget-category">🏠 Housing</span>
            <span className="budget-amount">${budgetRecommendation.housing}</span>
            <span className="budget-percentage">30%</span>
          </div>
          <div className="budget-item">
            <span className="budget-category">🍔 Food</span>
            <span className="budget-amount">${budgetRecommendation.food}</span>
            <span className="budget-percentage">15%</span>
          </div>
          <div className="budget-item">
            <span className="budget-category">🚗 Transportation</span>
            <span className="budget-amount">${budgetRecommendation.transportation}</span>
            <span className="budget-percentage">15%</span>
          </div>
          <div className="budget-item">
            <span className="budget-category">🎭 Entertainment</span>
            <span className="budget-amount">${budgetRecommendation.entertainment}</span>
            <span className="budget-percentage">10%</span>
          </div>
          <div className="budget-item">
            <span className="budget-category">💎 Savings</span>
            <span className="budget-amount">${budgetRecommendation.savings}</span>
            <span className="budget-percentage">20%</span>
          </div>
          <div className="budget-item">
            <span className="budget-category">📝 Other</span>
            <span className="budget-amount">${budgetRecommendation.other}</span>
            <span className="budget-percentage">10%</span>
          </div>
        </div>
        <p className="budget-note">
          💡 This is based on the 50/30/20 rule adapted for your income level
        </p>
      </div>

      {/* Financial Health Score */}
      <div className="health-score">
        <h3>🏥 Financial Health Score</h3>
        <div className="score-container">
          <div className="score-circle">
            <div className="score-number">
              {Math.min(100, Math.max(0, Math.round(
                (insights.find(i => i.id === 'savings-rate')?.value.replace('%', '') || 0) * 2 +
                (receivedEntries.reduce((sum, entry) => sum + entry.amount, 0) > 
                 givenEntries.reduce((sum, entry) => sum + entry.amount, 0) ? 30 : 0) +
                (recommendations.length === 0 ? 20 : Math.max(0, 20 - recommendations.length * 5))
              )))}
            </div>
            <div className="score-label">Health Score</div>
          </div>
          <div className="score-breakdown">
            <div className="score-item">
              <span>Savings Rate</span>
              <span>{insights.find(i => i.id === 'savings-rate')?.value || '0%'}</span>
            </div>
            <div className="score-item">
              <span>Income vs Expenses</span>
              <span className={receivedEntries.reduce((sum, entry) => sum + entry.amount, 0) > 
                             givenEntries.reduce((sum, entry) => sum + entry.amount, 0) ? 'positive' : 'negative'}>
                {receivedEntries.reduce((sum, entry) => sum + entry.amount, 0) > 
                 givenEntries.reduce((sum, entry) => sum + entry.amount, 0) ? 'Positive' : 'Negative'}
              </span>
            </div>
            <div className="score-item">
              <span>Areas for Improvement</span>
              <span>{recommendations.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialInsights;