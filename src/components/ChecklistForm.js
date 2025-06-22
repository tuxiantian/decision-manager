import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import api from './api.js'
import './ChecklistForm.css';
import DecisionFlowTool from './DecisionFlowTool'; // 引入新的流程图组件
import isEqual from 'lodash/isEqual'; 

const ChecklistForm = () => {
  const { checklistId } = useParams();  // 获取路由中的 checklistId 参数
  const [checklistName, setChecklistName] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([]);
  const [activeTab, setActiveTab] = useState('form');
  const [flowData, setFlowData] = useState({});
  const [originalData, setOriginalData] = useState({
    name: '',
    description: '',
    questions: [],
    flowData: { nodes: [], connections: [] }
  });
  const navigate = useNavigate();
  // 使用计数器生成临时ID
  const tempIdCounter = useRef(0);
  const generateTempId = () => `temp-${tempIdCounter.current++}`;

  // 用于标记是否阻止滚轮事件的标志
  const [isWheelEnabled, setIsWheelEnabled] = useState(false);
    // 阻止页面滚动条的默认滚轮行为
  useEffect(() => {
    const handleWheel = (e) => {
      if (isWheelEnabled) {
        e.preventDefault();
      }
    };

    // 监听滚轮事件，使用 { passive: false } 以确保可以调用 preventDefault
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, [isWheelEnabled]);

  // 当切换到流程图标签时，允许滚轮事件
  useEffect(() => {
    setIsWheelEnabled(activeTab === 'flowchart');
  }, [activeTab]);


  // 根据 checklistId 判断是否为更新模式，并在组件加载时获取数据
  useEffect(() => {
    if (checklistId) {
      api.get(`${API_BASE_URL}/platform_checklists/${checklistId}`)
        .then(response => {
          const data = response.data;
          setChecklistName(data.name);
          setDescription(data.description);
                    // 创建问题ID映射
          const questionMap = {};
          data.questions.forEach(q => {
            questionMap[q.id] = q;
          });

          // 转换问题数据
          const formattedQuestions = data.questions.map(q => {
            // 转换follow_up_questions格式
            const followUpQuestions = {};
            if (q.follow_up_questions) {
              Object.entries(q.follow_up_questions).forEach(([key, val]) => {
                followUpQuestions[key] = Array.isArray(val) ? val : [val];
              });
            }

            // 设置parentTempId
            let parentTempId = null;
            for (const parentQ of data.questions) {
              if (parentQ.follow_up_questions) {
                for (const [optIndex, ids] of Object.entries(parentQ.follow_up_questions)) {
                  if (ids.includes(q.id)) {
                    parentTempId = parentQ.id;
                    break;
                  }
                }
              }
              if (parentTempId) break;
            }

            return {
              id: q.id,
              type: q.type || 'text',
              question: q.question,
              description: q.description || '',
              options: q.options || [],
              followUpQuestions,
              parentTempId
            };
          });
          setQuestions(formattedQuestions);
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

          // 保存原始数据
          setOriginalData({
            name: data.name,
            description: data.description,
            questions: formattedQuestions,
            flowData: data.mermaid_code ? JSON.parse(data.mermaid_code) : { nodes: [], connections: [] }
          });
        })
        .catch(error => {
          console.error('There was an error fetching the checklist details!', error);
        });
    }
  }, [checklistId]);

  const hasChanges = useCallback(() => {
    return (
    checklistName !== originalData.name ||
    description !== originalData.description ||
    !isEqual(questions, originalData.questions) ||
    !isEqual(flowData, originalData.flowData)
  );
  }, [checklistName, description, questions, flowData, originalData]);

  const handleFlowChange = useCallback((nodes, connections) => {
    setFlowData({ nodes, connections });
  }, []); // 依赖数组为空，函数引用永远不变

  const handleAddQuestion = (parentId = null, optionIndex = null) => {
    const newQuestion = {
      id: generateTempId(),
      type: 'text',
      question: '',
      description: '',
      options: [],
      followUpQuestions: {},
      parentTempId: parentId || null
    };

    setQuestions(prevQuestions => {
      // 先添加新问题
      const updatedQuestions = [...prevQuestions, newQuestion];

      if (parentId && optionIndex !== null) {
        // 然后更新父问题的followUpQuestions
        return updatedQuestions.map(q => {
          if (q.id === parentId) {
            const updatedFollowUps = {
              ...q.followUpQuestions,
              [optionIndex]: [
                ...(q.followUpQuestions[optionIndex] || []),
                newQuestion.id
              ]
            };
            return { ...q, followUpQuestions: updatedFollowUps };
          }
          return q;
        });
      }

      return updatedQuestions;
    });
  };

  const handleQuestionChange = (id, value) => {
    setQuestions(prevQuestions =>
      prevQuestions.map(q =>
        q.id === id ? { ...q, question: value } : q
      )
    );
  };

  const handleDescriptionChange = (id, value) => {
    setQuestions(prevQuestions =>
      prevQuestions.map(q =>
        q.id === id ? { ...q, description: value } : q
      )
    );
  };

  const moveQuestion = (id, direction) => {
    setQuestions(prevQuestions => {
      // Create a new array to avoid direct state mutation
      const newQuestions = [...prevQuestions];

      // Find all parent questions (top-level questions)
      const parentIndices = newQuestions
        .map((q, index) => (!q.parentTempId ? index : -1))
        .filter(index => index !== -1);

      const currentIndex = newQuestions.findIndex(q => q.id === id);

      // Only process if the question exists and is a parent question
      if (currentIndex === -1 || newQuestions[currentIndex].parentTempId) {
        return prevQuestions;
      }

      // Find our position in the parent questions array
      const parentPosition = parentIndices.indexOf(currentIndex);

      if (direction === 'up') {
        // Can't move up if already at the top
        if (parentPosition <= 0) return prevQuestions;

        // Get the index of the previous parent
        const prevParentIndex = parentIndices[parentPosition - 1];

        // Swap the current parent with the previous parent
        [newQuestions[currentIndex], newQuestions[prevParentIndex]] =
          [newQuestions[prevParentIndex], newQuestions[currentIndex]];
      }
      else { // direction === 'down'
        // Can't move down if already at the bottom
        if (parentPosition >= parentIndices.length - 1) return prevQuestions;

        // Get the index of the next parent
        const nextParentIndex = parentIndices[parentPosition + 1];

        // Swap the current parent with the next parent
        [newQuestions[currentIndex], newQuestions[nextParentIndex]] =
          [newQuestions[nextParentIndex], newQuestions[currentIndex]];
      }

      return newQuestions;
    });
  };


  const handleSubmit = async () => {
    try {
      const requestData = {
        name: checklistName,
        description,
        questions: questions.map(q => ({
          tempId: String(q.id),
          id: q.id,
          type: q.type,
          question: q.question,
          description: q.description,
          options: q.options,
          followUpQuestions: q.followUpQuestions,
          parentTempId: q.parentTempId
        })),
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

    // 删除问题
  const handleRemoveQuestion = (id) => {
    setQuestions(prevQuestions => {
      // 先删除所有引用这个问题的followUpQuestions
      const cleanedQuestions = prevQuestions.map(q => {
        const cleanedFollowUps = {};
        for (const [optIndex, followUpIds] of Object.entries(q.followUpQuestions || {})) {
          cleanedFollowUps[optIndex] = followUpIds.filter(followUpId => followUpId !== id);
        }
        return { ...q, followUpQuestions: cleanedFollowUps };
      });

      // 然后删除问题本身
      return cleanedQuestions.filter(q => q.id !== id);
    });
  };


  // 更改问题类型
  const handleTypeChange = (id, newType) => {
    setQuestions(prevQuestions =>
      prevQuestions.map(q =>
        q.id === id
          ? {
            ...q,
            type: newType,
            options: newType === 'choice' ? ['', ''] : [],
            followUpQuestions: {}
          }
          : q
      )
    );
  };

  // 更改选择题选项
  const handleOptionChange = (questionId, optionIndex, value) => {
    setQuestions(prevQuestions =>
      prevQuestions.map(q => {
        if (q.id !== questionId) return q;

        const newOptions = [...q.options];
        newOptions[optionIndex] = value;

        return { ...q, options: newOptions };
      })
    );
  };

  // 添加选择题选项
  const handleAddOption = (questionId) => {
    setQuestions(prevQuestions =>
      prevQuestions.map(q =>
        q.id === questionId && q.options.length < 4
          ? { ...q, options: [...q.options, ''] }
          : q
      )
    );
  };

  const handleRemoveOption = (questionId, optionIndex) => {
    setQuestions(prevQuestions =>
      prevQuestions.map(q => {
        if (q.id !== questionId) return q;

        const newOptions = q.options.filter((_, idx) => idx !== optionIndex);
        const newFollowUps = { ...q.followUpQuestions };
        delete newFollowUps[optionIndex];

        // 调整后续的followUpQuestions索引
        const adjustedFollowUps = Object.entries(newFollowUps)
          .reduce((acc, [key, val]) => {
            const numKey = Number(key);
            if (numKey > optionIndex) {
              acc[numKey - 1] = val;
            } else if (numKey < optionIndex) {
              acc[key] = val;
            }
            return acc;
          }, {});

        return {
          ...q,
          options: newOptions,
          followUpQuestions: adjustedFollowUps
        };
      })
    );
  };

    // 渲染问题列表（不再递归渲染）
  const renderQuestions = () => {
    // 获取所有顶级问题（没有父问题的问题）
    const topLevelQuestions = questions.filter(q => {
      // 没有父问题 且 不是任何问题的followUpQuestion
      return !q.parentTempId &&
        !questions.some(otherQ =>
          Object.values(otherQ.followUpQuestions || {}).flat().includes(q.id)
        );
    });

    return (
      <div className="questions-list">
        {topLevelQuestions.map(question => (
          <div key={question.id} className="question-item">
            {renderQuestionItem(question)}
          </div>
        ))}

        <button
          onClick={() => handleAddQuestion()}
          className="add-btn"
        >
          Add Top-Level Question
        </button>
      </div>
    );
  };

  // 新增辅助函数：获取父问题信息
  const getParentQuestionInfo = (questionId) => {
    const question = questions.find(q => q.id === questionId);
    if (!question || !question.parentTempId) return null;

    const parentQuestion = questions.find(q => q.id === question.parentTempId);
    if (!parentQuestion) return null;

    // 找出是父问题的哪个选项引用了当前问题
    const optionEntry = Object.entries(parentQuestion.followUpQuestions || {})
      .find(([_, ids]) => ids.includes(questionId));

    if (!optionEntry) return null;

    const [optIndex, ids] = optionEntry;
    return {
      parentQuestion: parentQuestion.question || 'Untitled question',
      optionText: parentQuestion.options[optIndex] || `Option ${Number(optIndex) + 1}`,
      order: ids.indexOf(questionId)
    };
  };

  // 渲染单个问题项
  const renderQuestionItem = (question) => {
    // 获取父问题信息（如果是后续问题）
    const parentInfo = getParentQuestionInfo(question.id);
    // 获取当前问题的直接后续问题
    const followUpQuestions = questions.filter(q =>
      q.parentTempId === question.id
    );

    return (
      <div className="question-content">
        {/* 显示父问题路径（如果是后续问题） */}
        {parentInfo && (
          <div className="question-path">
            <span className="path-item">Parent: {parentInfo.parentQuestion}</span>
            <span className="path-separator">→</span>
            <span className="path-item">Option: {parentInfo.optionText}</span>
            <span className="path-separator">→</span>
            <span className="path-item">Follow-up #{parentInfo.order + 1}</span>
          </div>
        )}
        <div className="question-header">
          <div className="question-type">
            <label>Question Type:</label>
            <select
              value={question.type}
              onChange={(e) => handleTypeChange(question.id, e.target.value)}
            >
              <option value="text">Text Answer</option>
              <option value="choice">Multiple Choice</option>
            </select>
          </div>

          <div className="question-text">
            <label>Question:</label>
            <input
              type="text"
              placeholder="Enter question"
              maxLength={255}
              value={question.question}
              onChange={(e) => handleQuestionChange(question.id, e.target.value)}
            />
          </div>
        </div>

        <textarea
          placeholder="Enter description (max 255 characters)"
          maxLength={255}
          value={question.description}
          onChange={(e) => handleDescriptionChange(question.id, e.target.value)}
          className="description-textarea"
        />

        <div className="question-actions">
          <button
            onClick={() => handleRemoveQuestion(question.id)}
            className="remove-btn"
          >
            Remove
          </button>
          {/* 只显示顶级问题的移动按钮 */}
          {!parentInfo && (
            <>
              <button
                onClick={() => moveQuestion(question.id, 'up')}
                disabled={questions.findIndex(q => q.id === question.id) === 0}
                className="move-btn"
              >
                Move Up
              </button>
              <button
                onClick={() => moveQuestion(question.id, 'down')}
                disabled={questions.findIndex(q => q.id === question.id) === questions.length - 1}
                className="move-btn"
              >
                Move Down
              </button>
            </>
          )}
        </div>

        {question.type === 'choice' && (
          <div className="options-section">
            <div className="options-container">
              <label>Options:</label>
              {question.options.map((option, optIndex) => (
                <div key={optIndex} className="option-row">
                  <input
                    type="text"
                    placeholder={`Option ${optIndex + 1}`}
                    value={option}
                    onChange={(e) => handleOptionChange(question.id, optIndex, e.target.value)}
                  />
                  <div className="option-actions">
                    <button
                      onClick={() => handleRemoveOption(question.id, optIndex)}
                      className="remove-option-btn"
                    >
                      Remove
                    </button>
                    {/* 修改为总是显示Add Follow-up按钮 */}
                    <button
                      onClick={() => handleAddQuestion(question.id, optIndex)}
                      className="add-followup-btn"
                    >
                      Add Follow-up
                    </button>
                  </div>
                  {/* 显示当前选项已有的后续问题数量 */}
                  {question.followUpQuestions?.[optIndex]?.length > 0 && (
                    <span className="follow-up-count">
                      ({question.followUpQuestions[optIndex].length} follow-ups)
                    </span>
                  )}
                </div>
              ))}
              {question.options.length < 4 && (
                <button
                  onClick={() => handleAddOption(question.id)}
                  className="add-option-btn"
                >
                  Add Option
                </button>
              )}
            </div>
          </div>
        )}

        {/* 渲染后续问题 */}
        {followUpQuestions.length > 0 && (
          <div className="follow-up-questions">
            {followUpQuestions.map(followUp => (
              <div key={followUp.id} className="follow-up-item">
                {renderQuestionItem(followUp)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
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
            {renderQuestions()}
          </div>
          <div className="buttons-group">
            <button onClick={handleSubmit} disabled={checklistId && !hasChanges()} className={`submit-btn ${checklistId && !hasChanges() ? 'disabled' : ''}`}>Submit Checklist</button>
            <button onClick={() => navigate('/checklists')} className="cancel-btn">Back to List</button>
          </div>

        </div>
      )}
    </div>
  );
};

export default ChecklistForm;