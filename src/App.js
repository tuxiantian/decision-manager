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

function App() {
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
          <Link className="nav-link" to="/balanced-decisions">BalancedDecisionMaker</Link>
          <Link className="nav-link" to="/articles">Article</Link>
          <Link className="nav-link" to="/checklists">Checklists</Link>
          <Link className="nav-link" to="/decisions">Decisions List</Link>
          <Link className="nav-link" to="/ahp">AHPAnalysis List</Link>
          <Link className="nav-link" to="/todos">Todo List</Link>
        </nav>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/articles" element={<ArticleList />} />
          <Route path="/add-article" element={<ArticleEditor />} />
          <Route path="/edit-article/:id" element={<ArticleEditor />} />
          <Route path="/view-article/:id" element={<ArticleViewer />} />
          {/* <Route path="/balanced-decisions" element={<BalancedDecision />} />
          <Route path="/decisions" element={<DecisionsList />} />
          <Route path="/ahp" element={<AHPAnalysis />} />
          <Route path="/checklist-form" element={<ChecklistForm />} />
          <Route path="/checklists" element={<ChecklistList />} />
          <Route path="/checklist/:checklistId" element={<ChecklistDetail />} />
          <Route path="/history" element={<ChecklistAnswerHistory />} />
          <Route path="/checklist/update/:checklistId" element={<ChecklistUpdate />} />
          <Route path="/todos" element={<TodoList />} />
          <Route path="/checklist/flowchart/:checklistId" element={<FlowchartDetail />} /> */}
        </Routes>
    </div>
  );
}

export default App;
