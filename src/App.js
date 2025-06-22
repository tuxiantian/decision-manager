import logo from './logo.svg';
import './App.css';
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from 'react-router-dom';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import Home from './Home';
import ArticleList from './components/ArticleList';
import ArticleEditor from './components/ArticleEditor';
import ArticleViewer from './components/ArticleViewer';
import ChecklistList from './components/checklist/ChecklistList';
import FlowchartDetail from './components/checklist/FlowchartDetail';
import ChecklistForm from './components/checklist/ChecklistForm';
import StatisticsDashboard from './components/StatisticsDashboard';
import LogicErrorList from './components/LogicErrorList';
import FeedbackAdmin from './components/FeedbackAdmin';
import Ahp from './components/Ahp';
import BalancedDecision from './components/BalancedDecision';
import ChecklistDecision from './components/checklist/ChecklistDecision';
import InspirationManagement from './components/InspirationManagement';
import UserManagement from './components/UserManagement';
import api from './components/api';

function App() {
  const [username, setUsername] = useState(null); // 存储用户名
  const [activeMenu, setActiveMenu] = useState(null);
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

  // 菜单数据结构
  const menuItems = [
    {
      title: '首页',
      path: '/',
    },
    {
      title: '决策工具',
      submenu: [
        { title: '平衡决策', path: '/balanced-decisions' },
        { title: 'AHP分析', path: '/ahp' },
        { title: '决策清单', path: '/checklists' },
        {
          title: '新建决策清单',
          path: '/checklist-form'
        },
        { title: '决策结果', path: '/decisions' },
      ],
    },
    {
      title: '内容管理',
      submenu: [
        { title: '文章列表', path: '/articles' },
        { title: '逻辑错误库', path: '/logic-errors' },
        { title: '启发管理', path: '/inspirations' },
      ],
    },
    {
      title: '系统管理',
      submenu: [
        { title: '用户管理', path: '/user-management' },
        { title: '反馈管理', path: '/feedback' },
      ],
    },
    {
      title: username ? `欢迎, ${username}` : '账户',
      submenu: username
        ? [
          { title: '退出登录', action: handleLogout },
        ]
        : [
          { title: '登录', path: '/login' },
          { title: '注册', path: '/register' },
        ],
    },
  ];

  // 切换二级菜单显示
  const toggleMenu = (menuTitle) => {
    setActiveMenu(activeMenu === menuTitle ? null : menuTitle);
  };

  // 点击菜单项处理
  const handleMenuItemClick = (item) => {
    if (item.action) {
      item.action();
    } else if (item.path) {
      navigate(item.path);
      setActiveMenu(null); // 导航后关闭菜单
    }
  };

  return (
    <div className="App">
      <nav className="main-nav">
        <ul className="nav-list">
          {menuItems.map((item, index) => (
            <li
              key={index}
              className={`nav-item ${item.submenu ? 'has-submenu' : ''}`}
              onMouseEnter={() => item.submenu && setActiveMenu(item.title)}
              onMouseLeave={() => item.submenu && activeMenu === item.title && setActiveMenu(null)}
            >
              {item.submenu ? (
                <>
                  <span
                    className="nav-link"
                    onClick={() => toggleMenu(item.title)}
                  >
                    {item.title}
                  </span>
                  {activeMenu === item.title && (
                    <ul className="submenu">
                      {item.submenu.map((subItem, subIndex) => (
                        <li key={subIndex}>
                          <span
                            className="submenu-link"
                            onClick={() => handleMenuItemClick(subItem)}
                          >
                            {subItem.title}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <Link
                  className="nav-link"
                  to={item.path}
                  onClick={() => setActiveMenu(null)}
                >
                  {item.title}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
      <Routes>
        <Route path="/" element={<StatisticsDashboard />} />
        <Route path="/login" element={<LoginPage onLogin={setUsername} />} />
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
        <Route path="/inspirations" element={<InspirationManagement />} />
        <Route path="/user-management" element={<UserManagement />} />
        <Route path="/ahp" element={<Ahp />} />
        <Route path="/balanced-decisions" element={<BalancedDecision />} />
        <Route path="/decisions" element={<ChecklistDecision />} />

      </Routes>
    </div>
  );
}

export default App;
