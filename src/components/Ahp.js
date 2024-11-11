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

import './Ahp.css';

// 注册所需的图表模块
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Ahp = () => {
    const [chartData, setChartData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            const response = await api.get('/api/statistics/ahp_data?days=30');
            const data = response.data.ahp_trend;  // 提取 ahp_trend 数组
            const chartData = {
                labels: data.map(item => item.date),
                datasets: [
                    {
                        label: 'AHP Trend Count',
                        data: data.map(item => item.count),
                        borderColor: 'rgba(54, 162, 235, 1)',
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderWidth: 2,
                        tension: 0.3,
                        pointRadius: 4,
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
                    <Line data={chartData} options={{ maintainAspectRatio: false }} />
                ) : (
                    <p>加载数据中...</p>
                )}
            </div>
        </div>
    );
};

export default Ahp;
