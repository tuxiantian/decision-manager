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
import './Ahp.css';

// 注册 Bar 图表所需的模块
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Ahp = () => {
    const [chartData, setChartData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            const response = await api.get('/api/statistics/ahp_data?days=30');
            const data = response.data.ahp_trend;
            const chartData = {
                labels: data.map(item => item.date),
                datasets: [
                    {
                        label: 'AHP Trend Count',
                        data: data.map(item => item.count),
                        backgroundColor: 'rgba(54, 162, 235, 0.6)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1,
                        borderRadius: 5,
                    },
                ],
            };
            setChartData(chartData);
        };
        fetchData();
    }, []);

    return (
        <div className="ahp-container">
            <h2 className="ahp-title">AHP 趋势图</h2>
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

export default Ahp;
