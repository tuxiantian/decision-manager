import React, { useEffect, useState } from 'react';
import api from '../api.js';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

import './ChecklistDecision.css';

// 注册所需的图表模块
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const ChecklistDecision = () => {
    const [chartData, setChartData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            const response = await api.get('/api/statistics/checklist_decisions?days=30');
            const data = response.data.decision_trend;
            const chartData = {
                labels: data.map(item => item.date),
                datasets: [
                    {
                        label: 'Checklist Decision Trend',
                        data: data.map(item => item.count),
                        borderColor: 'rgba(54, 162, 235, 1)',
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderWidth: 2,
                        tension: 0.3,
                        pointRadius: 3,
                    },
                ],
            };
            setChartData(chartData);
        };
        fetchData();
    }, []);

    return (
        <div className="checklist-decision-container">
            <h2 className="checklist-decision-title">Checklist 决策趋势图</h2>
            <div className="chart-container">
                {chartData ? (
                    <Line data={chartData} options={{ maintainAspectRatio: false }} />
                ) : (
                    <p>加载数据中...</p>
                )}
            </div>
        </div>
    );
};

export default ChecklistDecision;
