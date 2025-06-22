import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import mermaid from 'mermaid';
import { API_BASE_URL } from '../config.js';
import api from './api.js'
import './ChecklistForm.css';

// 初始化 Mermaid 配置
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  themeCSS: `
        .nodeLabel  p {
          white-space: pre-wrap;         /* 强制长文本换行 */
        }
   `,
  flowchart: { curve: 'linear' },
  securityLevel: 'loose',
});

const ChecklistForm = () => {
  const { checklistId } = useParams();  // 获取路由中的 checklistId 参数
  const [checklistName, setChecklistName] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([{ question: '', description: '' }]);
  const [mermaidCode, setMermaidCode] = useState('');
  const [activeTab, setActiveTab] = useState('form');
  const [renderError, setRenderError] = useState(null);
  const mermaidContainerRef = useRef(null);
  const navigate = useNavigate();

  // 根据 checklistId 判断是否为更新模式，并在组件加载时获取数据
  useEffect(() => {
    if (checklistId) {
      api.get(`${API_BASE_URL}/platform_checklists/${checklistId}`)
        .then(response => {
          const data = response.data;
          setChecklistName(data.name);
          setDescription(data.description);
          setMermaidCode(data.mermaid_code);
          setQuestions(data.questions.map(q => ({
            question: q.question,
            description: q.description || '',
          })));
        })
        .catch(error => {
          console.error('There was an error fetching the checklist details!', error);
        });
    }
  }, [checklistId]);

  // 独立函数处理 Mermaid 渲染
  const renderMermaid = async () => {
    if (mermaidCode && mermaidCode.trim() && mermaidContainerRef.current) {
      try {
        setRenderError(null); // 清除之前的错误信息

        // Mermaid 渲染：对指定容器进行渲染
        const { svg } = await mermaid.render('generatedDiagram', mermaidCode);
        if (mermaidContainerRef.current) {
          mermaidContainerRef.current.innerHTML = svg;
        }
      } catch (e) {
        console.error('Mermaid rendering error:', e);
        setRenderError('Mermaid rendering error: Unable to render the flowchart. Please check your syntax.');
      }
    }
  };

  useEffect(() => {
    if (mermaidCode && mermaidCode.trim()) {
      setTimeout(() => {
        renderMermaid();
      }, 100);
    }
  }, [mermaidCode]);

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

  const handlePreviewFlowchart = () => {
    if (mermaidCode && mermaidCode.trim()) {
      setRenderError(null); // 清除之前的错误信息
      renderMermaid(); // 触发渲染逻辑
    } else {
      setRenderError('Mermaid code cannot be empty');
    }
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
        mermaid_code: mermaidCode,
        user_id: 1,
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
        <div className="tab-content">
          <h3>Mermaid Flowchart Editor</h3>
          <textarea
            value={mermaidCode}
            onChange={(e) => setMermaidCode(e.target.value)}
            rows="10"
            cols="50"
            style={{ width: '100%', marginBottom: '20px' }}
          />
          <button className="preview-btn" onClick={handlePreviewFlowchart}>Preview Flowchart</button>
          {renderError && (
            <div style={{ color: 'red', marginTop: '10px' }}>
              <strong>Error:</strong> {renderError}
            </div>
          )}
          <div
            className="mermaid-preview"
            ref={mermaidContainerRef}
            style={{ marginTop: '20px', minHeight: '200px', border: '1px solid #ccc', padding: '10px' }}
          ></div>
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