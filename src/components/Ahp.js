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

const Ahp = () => {
    const [decisionData, setDecisionData] = useState(null);

    useEffect(() => {
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
        <div>
            {decisionData && (
                <div className="chart-container">
                    <h2>Total AHP Data: {decisionData.total_ahp_data}</h2>
                    <Line data={formatChartData(decisionData.ahp_trend, 'AHP Data Trend')} />
                </div>
            )}
        </div>
    );
};

export default Ahp;