import React, { useEffect, useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
  } from 'chart.js';
import { Line } from 'react-chartjs-2';
import './StatisticsDashboard.css';
import api from './api.js';

// 注册必要的组件
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
  );

function StatisticsDashboard() {
  const [userData, setUserData] = useState(null);
  const [articleData, setArticleData] = useState(null);
  const [checklistData, setChecklistData] = useState(null);
  const [decisionData, setDecisionData] = useState(null);

  // Fetch data from API
  useEffect(() => {
    // Fetch user statistics
    api.get('/api/statistics/users?days=30')
      .then(response => setUserData(response.data))
      .catch(error => console.error('Error fetching user data:', error));

    // Fetch article statistics
    api.get('/api/statistics/articles?days=30')
      .then(response => setArticleData(response.data))
      .catch(error => console.error('Error fetching article data:', error));

    // Fetch checklist statistics
    api.get('/api/statistics/checklists?days=30')
      .then(response => setChecklistData(response.data))
      .catch(error => console.error('Error fetching checklist data:', error));

    // Fetch decision data statistics
    api.get('/api/statistics/decision_data?days=30')
      .then(response => setDecisionData(response.data))
      .catch(error => console.error('Error fetching decision data:', error));
  }, []);

  // Helper function to format data for Chart.js
  const formatChartData = (trendData, label) => {
    if (!trendData) return null;
    const labels = trendData.map(item => item.date);
    const data = trendData.map(item => item.count);

    return {
      labels,
      datasets: [
        {
          label,
          data,
          fill: false,
          borderColor: '#4bc0c0',
          tension: 0.1,
        },
      ],
    };
  };

  return (
    <div className="statistics-dashboard">
      <h1>Statistics Dashboard</h1>

      {userData && (
        <div className="chart-container">
          <h2>Total Users: {userData.total_users}</h2>
          <Line data={formatChartData(userData.new_users_trend, 'New Users')} />
        </div>
      )}

      {articleData && (
        <div className="chart-container">
          <h2>Total Articles: {articleData.total_articles}</h2>
          <Line data={formatChartData(articleData.new_articles_trend, 'New Articles')} />
        </div>
      )}

      {checklistData && (
        <div className="chart-container">
          <h2>Total Checklists: {checklistData.total_checklists}</h2>
          <h3>Total Clones: {checklistData.total_clones}</h3>
          <Line data={formatChartData(checklistData.checklist_trend, 'Checklist Trend')} />
        </div>
      )}

      {decisionData && (
        <div className="chart-container">
          <h2>Total AHP Data: {decisionData.total_ahp_data}</h2>       
          <Line data={formatChartData(decisionData.ahp_trend, 'AHP Data Trend')} />      
        </div>
      )}

    {decisionData && (
        <div className="chart-container"> 
          <h3>Total Balanced Decision Data: {decisionData.total_balanced_decision_data}</h3>
          <Line data={formatChartData(decisionData.balanced_decision_trend, 'Balanced Decision Trend')} />
        </div>
      )}
    </div>
  );
}

export default StatisticsDashboard;
