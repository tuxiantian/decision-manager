import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

import api from './api';
import './BalancedDecision.css';

// 注册所需的图表模块
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const BalancedDecision = () => {
    const [chartData, setChartData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            const response = await api.get('/api/statistics/balanced_decision_data');
            const data = response.data.balanced_decision_trend;
            const chartData = {
                labels: data.map(item => item.label),
                datasets: [
                    {
                        label: 'Balanced Decision Data',
                        data: data.map(item => item.value),
                        backgroundColor: 'rgba(255, 99, 132, 0.6)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1,
                        borderRadius: 5, // 设置圆角
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
                    <Bar data={chartData} options={{ maintainAspectRatio: false }} />
                ) : (
                    <p>加载数据中...</p>
                )}
            </div>
        </div>
    );
};

export default BalancedDecision;
