import logo from './logo.svg';
import './App.css';
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes,Link, useNavigate } from 'react-router-dom';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import Home from './Home';
import ArticleList from './components/ArticleList';
import ArticleEditor from './components/ArticleEditor';
import ArticleViewer from './components/ArticleViewer';
import ChecklistList from './components/ChecklistList';
import FlowchartDetail from './components/FlowchartDetail';
import ChecklistForm from './components/ChecklistForm';
import StatisticsDashboard from './components/StatisticsDashboard';
import LogicErrorList from './components/LogicErrorList';
import FeedbackAdmin from './components/FeedbackAdmin';
import Ahp from './components/Ahp';
import BalancedDecision from './components/BalancedDecision';
import ChecklistDecision from './components/ChecklistDecision';
import api from './components/api'; 

function App() {
  const [username, setUsername] = useState(null); // 存储用户名
  const navigate = useNavigate();

  useEffect(() => {
    // 检查用户登录状态，获取用户名
    const fetchUserInfo = async () => {
      try {
        const response = await api.get('/profile'); // 假设此端点返回用户信息
        setUsername(response.data.username);
        localStorage.setItem('username', response.data.username); // 同步用户名到 localStorage
      } catch (error) {
        console.log("用户未登录");
      }
    };
    // 如果 localStorage 中没有用户名，则重新获取
    if (!username) {
      fetchUserInfo();
    }
  }, []);

  // 处理用户退出逻辑
  const handleLogout = async () => {
    try {
      await api.post('/logout'); // 假设此端点处理退出逻辑
      setUsername(null); // 清除用户名状态
      localStorage.removeItem('username'); // 清除 localStorage 中的用户名
      navigate('/login'); // 跳转到登录页面
    } catch (error) {
      console.log("退出失败", error);
    }
  };

  return (
    <div className="App">
      <nav style={{
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'center', // 导航栏项居中对齐
          backgroundColor: '#333',  // 导航栏背景颜色
          padding: '10px 0',        // 导航栏内填充
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' // 添加阴影效果
        }}>
          <Link className="nav-link" to="/">Home</Link>
          <Link className="nav-link" to="/balanced-decisions">BalancedDecision</Link>
          <Link className="nav-link" to="/articles">Article</Link>
          <Link className="nav-link" to="/checklists">Checklists</Link>
          <Link className="nav-link" to="/decisions">ChecklistDecision</Link>
          <Link className="nav-link" to="/logic-errors">LogicError List</Link>
          <Link className="nav-link" to="/ahp">AHPAnalysis List</Link>
          <Link className="nav-link" to="/feedback">用户反馈管理</Link>

          {username ? (
                <>
                  <Link className="nav-link" disabled>Welcome, {username}</Link>
                  <Link className="nav-link" onClick={handleLogout}>Logout</Link>
                </>
              ) : (
                <>
                  <Link className="nav-link" as={Link} to="/login">Login</Link>
                  <Link className="nav-link" as={Link} to="/register">Register</Link>
                </>
              )}
        </nav>
        <Routes>
          <Route path="/" element={<StatisticsDashboard />} />
          <Route path="/login" element={<LoginPage  onLogin={setUsername} />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/articles" element={<ArticleList />} />
          <Route path="/add-article" element={<ArticleEditor />} />
          <Route path="/edit-article/:id" element={<ArticleEditor />} />
          <Route path="/view-article/:id" element={<ArticleViewer />} />
          <Route path="/checklists" element={<ChecklistList />} />
          <Route path="/checklist/flowchart/:checklistId" element={<FlowchartDetail />} />
          <Route path="/checklist-form" element={<ChecklistForm />} />
          <Route path="/checklist/update/:checklistId" element={<ChecklistForm />} />
          <Route path="/logic-errors" element={<LogicErrorList />} />
          <Route path="/feedback" element={<FeedbackAdmin />} />
          <Route path="/ahp" element={<Ahp />} />
          <Route path="/balanced-decisions" element={<BalancedDecision />} />
          <Route path="/decisions" element={<ChecklistDecision />} />

        </Routes>
    </div>
  );
}

export default App;
