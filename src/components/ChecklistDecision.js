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

const ChecklistDecision = () => {
    const [checklistDecisionData, setChecklistDecisionData] = useState(null);

    useEffect(() => {
        // 新增：获取 Checklist Decision 数据
        api.get('/api/statistics/checklist_decisions?days=30')
            .then(response => setChecklistDecisionData(response.data))
            .catch(error => console.error('Error fetching checklist decision data:', error));

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
            {checklistDecisionData && ( // 新增图表
                <div className="chart-container">
                    <h2>Total Checklist Decisions: {checklistDecisionData.total_decisions}</h2>
                    <Line data={formatChartData(checklistDecisionData.decision_trend, 'Checklist Decision Trend')} />
                </div>
            )}
        </div>
    );
};

export default ChecklistDecision;