import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import api from './api.js'
import './ChecklistForm.css';
import DecisionFlowTool from './DecisionFlowTool'; // 引入新的流程图组件


const ChecklistForm = () => {
  const { checklistId } = useParams();  // 获取路由中的 checklistId 参数
  const [checklistName, setChecklistName] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([{ question: '', description: '' }]);
  const [activeTab, setActiveTab] = useState('form');
  const [flowData, setFlowData] = useState({});
  const navigate = useNavigate();

  // 根据 checklistId 判断是否为更新模式，并在组件加载时获取数据
  useEffect(() => {
    if (checklistId) {
      api.get(`${API_BASE_URL}/platform_checklists/${checklistId}`)
        .then(response => {
          const data = response.data;
          setChecklistName(data.name);
          setDescription(data.description);
          setQuestions(data.questions.map(q => ({
            question: q.question,
            description: q.description || '',
          })));
          // 尝试解析mermaid_code字段，它现在存储的是流程图数据的JSON字符串
          if (data.mermaid_code) {
            try {
              const parsedFlowData = JSON.parse(data.mermaid_code);
              setFlowData(parsedFlowData);
            } catch (e) {
              console.error('Failed to parse flow data', e);
              // 如果解析失败，使用空数据
              setFlowData({ nodes: [], connections: [] });
            }
          } else {
            setFlowData({ nodes: [], connections: [] });
          }
        })
        .catch(error => {
          console.error('There was an error fetching the checklist details!', error);
        });
    }
  }, [checklistId]);

  const handleFlowChange = useCallback((nodes, connections) => {
    setFlowData({ nodes, connections });
  }, []); // 依赖数组为空，函数引用永远不变

  const handleAddQuestion = () => {
    setQuestions([...questions, { question: '', description: '' }]);
  };

  const handleRemoveQuestion = (index) => {
    const newQuestions = questions.filter((_, idx) => idx !== index);
    setQuestions(newQuestions);
  };

  const handleQuestionChange = (index, value) => {
    const newQuestions = [...questions];
    newQuestions[index].question = value;
    setQuestions(newQuestions);
  };

  const handleDescriptionChange = (index, value) => {
    const newQuestions = [...questions];
    newQuestions[index].description = value;
    setQuestions(newQuestions);
  };

  const moveQuestionUp = (index) => {
    if (index > 0) {
      const newQuestions = [...questions];
      [newQuestions[index - 1], newQuestions[index]] = [newQuestions[index], newQuestions[index - 1]];  // 交换顺序
      setQuestions(newQuestions);
    }
  };

  const moveQuestionDown = (index) => {
    if (index < questions.length - 1) {
      const newQuestions = [...questions];
      [newQuestions[index + 1], newQuestions[index]] = [newQuestions[index], newQuestions[index + 1]];  // 交换顺序
      setQuestions(newQuestions);
    }
  };


  const handleSubmit = async () => {
    try {
      const requestData = {
        name: checklistName,
        description,
        questions,
        mermaid_code: JSON.stringify(flowData)
      }
      if (checklistId) {
        // 更新模式
        await api.put(`${API_BASE_URL}/platform_checklists/${checklistId}`, requestData);
        console.log('Checklist updated successfully');
      } else {
        // 新增模式
        await api.post(`${API_BASE_URL}/platform_checklists`, requestData);
        console.log('Checklist created successfully');
      }
      navigate('/checklists');
    } catch (error) {
      console.error('Error saving checklist:', error);
    }
  };

  return (
    <div className="checklist-form">
      <h2>{checklistId ? 'Update Checklist' : 'Create Checklist'}</h2>
      <div className="tabs-container">
        <div className="tabs">
          <div
            className={`tab-button ${activeTab === 'flowchart' ? 'active' : ''}`}
            onClick={() => setActiveTab('flowchart')}
          >
            Flowchart
          </div>
          <div
            className={`tab-button ${activeTab === 'form' ? 'active' : ''}`}
            onClick={() => setActiveTab('form')}
          >
            Checklist Form
          </div>
        </div>
      </div>

      {activeTab === 'flowchart' && (
        <div className="flowchart-container">
          <DecisionFlowTool
            // 传递初始数据
            initialNodes={flowData.nodes}
            initialConnections={flowData.connections}
            // 当流程图数据改变时，更新flowData状态
            onFlowChange={handleFlowChange}
          />
        </div>
      )}

      {activeTab === 'form' && (
        <div className="tab-content">
          <div className="form-group">
            <label>Checklist Name:</label>
            <input
              type="text"
              placeholder="Enter checklist name"
              maxLength={100}
              value={checklistName}
              onChange={(e) => setChecklistName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Description:</label>
            <textarea
              placeholder="Enter checklist description"
              maxLength={255}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="questions-group">
            {questions.map((question, index) => (
              <div key={index} className="form-group question-item">
                <label>{`Question ${index + 1}:`}</label>
                <input
                  type="text"
                  placeholder={`Enter question ${index + 1}`}
                  maxLength={255}
                  value={question.question}
                  onChange={(e) => handleQuestionChange(index, e.target.value)}
                />
                <textarea
                  placeholder="Enter description (max 255 characters)"
                  maxLength={255}
                  value={question.description}
                  onChange={(e) => handleDescriptionChange(index, e.target.value)}
                  className="description-textarea"
                />
                <div className="button-group">
                  <button onClick={() => handleRemoveQuestion(index)} className="remove-btn">Remove</button>
                  <button onClick={() => moveQuestionUp(index)} disabled={index === 0} className="move-btn">Move Up</button>
                  <button onClick={() => moveQuestionDown(index)} disabled={index === questions.length - 1} className="move-btn">Move Down</button>
                </div>
              </div>
            ))}
            <button onClick={handleAddQuestion} className="add-btn">Add Question</button>
          </div>
          <div className="buttons-group">
            <button onClick={handleSubmit} className="submit-btn">Submit Checklist</button>
            <button onClick={() => navigate('/checklists')} className="cancel-btn">Back to List</button>
          </div>

        </div>
      )}
    </div>
  );
};

export default ChecklistForm;