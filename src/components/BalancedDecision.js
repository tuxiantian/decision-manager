import React, { useEffect, useState } from 'react';
import api from './api';
import { Line } from 'react-chartjs-2';
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

import './BalancedDecision.css';

// 注册所需的图表模块
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const BalancedDecision = () => {
    const [chartData, setChartData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            const response = await api.get('/api/statistics/balanced_decision_data?days=30');
            const data = response.data.balanced_decision_trend;
            const chartData = {
                labels: data.map(item => item.label),
                datasets: [
                    {
                        label: 'Balanced Decision Data',
                        data: data.map(item => item.value),
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderWidth: 2,
                        tension: 0.3,
                        pointRadius: 4,  // 节点大小
                    },
                ],
            };
            setChartData(chartData);
        };
        fetchData();
    }, []);

    return (
        <div className="balanced-decision-container">
            <h2 className="balanced-decision-title">平衡决策图表</h2>
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

export default BalancedDecision;
