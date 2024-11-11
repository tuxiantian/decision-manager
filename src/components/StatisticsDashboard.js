import React, { useEffect, useState } from 'react';
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

import api from './api';
import './StatisticsDashboard.css';

// 注册所需的图表模块
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const StatisticsDashboard = () => {
    const [usersData, setUsersData] = useState(null);
    const [articlesData, setArticlesData] = useState(null);
    const [checklistsData, setChecklistsData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            const usersResponse = await api.get('/api/statistics/users?days=30');
            const articlesResponse = await api.get('/api/statistics/articles?days=30');
            const checklistsResponse = await api.get('/api/statistics/checklists?days=30');

            setUsersData({
                labels: usersResponse.data.new_users_trend.map(item => item.date),
                datasets: [
                    {
                        label: 'New Users',
                        data: usersResponse.data.new_users_trend.map(item => item.count),
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderWidth: 2,
                        tension: 0.3,  // 使折线更平滑
                        pointRadius: 3,
                    },
                ],
            });

            setArticlesData({
                labels: articlesResponse.data.new_articles_trend.map(item => item.date),
                datasets: [
                    {
                        label: 'New Articles',
                        data: articlesResponse.data.new_articles_trend.map(item => item.count),
                        borderColor: 'rgba(255, 99, 132, 1)',
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderWidth: 2,
                        tension: 0.3,
                        pointRadius: 3,
                    },
                ],
            });

            setChecklistsData({
                labels: checklistsResponse.data.checklist_trend.map(item => item.date),
                datasets: [
                    {
                        label: 'New Checklists',
                        data: checklistsResponse.data.checklist_trend.map(item => item.count),
                        borderColor: 'rgba(54, 162, 235, 1)',
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderWidth: 2,
                        tension: 0.3,
                        pointRadius: 3,
                    },
                ],
            });
        };
        fetchData();
    }, []);

    return (
        <div className="statistics-dashboard">
            <h2 className="dashboard-title">统计仪表盘</h2>
            <div className="chart-wrapper">
                <div className="chart-container">
                    <h3>新增用户趋势</h3>
                    {usersData ? <Line data={usersData} options={{ maintainAspectRatio: false }} /> : <p>加载数据中...</p>}
                </div>
                <div className="chart-container">
                    <h3>新增文章趋势</h3>
                    {articlesData ? <Line data={articlesData} options={{ maintainAspectRatio: false }} /> : <p>加载数据中...</p>}
                </div>
                <div className="chart-container">
                    <h3>新增清单趋势</h3>
                    {checklistsData ? <Line data={checklistsData} options={{ maintainAspectRatio: false }} /> : <p>加载数据中...</p>}
                </div>
            </div>
        </div>
    );
};

export default StatisticsDashboard;
