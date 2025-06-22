import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DecisionFlowTool from './DecisionFlowTool';
import { API_BASE_URL } from '../../config.js';
import api from '../api.js';
import './ChecklistForm.css';
import isEqual from 'lodash/isEqual';

const ChecklistEditor = () => {
    const { checklistId } = useParams();
    const [checklistName, setChecklistName] = useState('');
    const [description, setDescription] = useState('');
    const [questions, setQuestions] = useState([]);
    const [flowData, setFlowData] = useState({});
    const [activeTab, setActiveTab] = useState('form');
    const [originalData, setOriginalData] = useState({
        name: '',
        description: '',
        questions: [],
        flowData: { nodes: [], connections: [] }
    });
    const navigate = useNavigate();

    // 加载清单数据
    useEffect(() => {
        if (checklistId) {
            api.get(`${API_BASE_URL}/platform_checklists/${checklistId}`)
                .then(response => {
                    const data = response.data;
                    setChecklistName(data.name);
                    setDescription(data.description);

                    // 转换问题数据
                    const formattedQuestions = data.questions.map(q => ({
                        id: q.id,
                        type: q.type || 'text',
                        question: q.question,
                        description: q.description || '',
                        options: q.options || []
                    }));

                    setQuestions(formattedQuestions);

                    // 解析流程图数据
                    if (data.mermaid_code) {
                        try {
                            setFlowData(JSON.parse(data.mermaid_code));
                        } catch (e) {
                            console.error('Failed to parse flow data', e);
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
                    console.error('Error fetching checklist details:', error);
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

    const handleFlowChange = (nodes, connections) => {
        setFlowData({ nodes, connections });
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

    const handleSubmit = async () => {
        try {
            const requestData = {
                name: checklistName,
                description,
                questions: questions.map(q => ({
                    id: q.id,
                    type: q.type,
                    question: q.question,
                    description: q.description,
                    options: q.options
                })),
                mermaid_code: JSON.stringify(flowData)
            };

            await api.patch(`${API_BASE_URL}/platform_checklists/${checklistId}/edit`, requestData);
            console.log('Checklist updated successfully');
            navigate('/checklists');
        } catch (error) {
            console.error('Error updating checklist:', error);
            if (error.response?.data?.error) {
                alert(error.response.data.error);
            }
        }
    };

    const renderQuestionItem = (question) => {
        return (
            <div className="question-content">
                <div className="question-header">
                    <div className="question-type">
                        <label>Question Type:</label>
                        <select value={question.type} disabled>
                            <option value="text">Text Answer</option>
                            <option value="choice">Multiple Choice</option>
                        </select>
                    </div>

                    <div className="question-text">
                        <label>Question:</label>
                        <input
                            type="text"
                            value={question.question}
                            onChange={(e) => handleQuestionChange(question.id, e.target.value)}
                        />
                    </div>
                </div>

                <textarea
                    value={question.description}
                    onChange={(e) => handleDescriptionChange(question.id, e.target.value)}
                    className="description-textarea"
                />

                {question.type === 'choice' && (
                    <div className="options-section">
                        <div className="options-container">
                            <label>Options:</label>
                            {question.options.map((option, optIndex) => (
                                <div key={optIndex} className="option-row">
                                    <input
                                        type="text"
                                        value={option}
                                        onChange={(e) => handleOptionChange(question.id, optIndex, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderQuestions = () => {
        return (
            <div className="questions-list">
                {questions.map(question => (
                    <div key={question.id} className="question-item">
                        {renderQuestionItem(question)}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="checklist-form">
            <h2>Edit Checklist</h2>
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
                        initialNodes={flowData.nodes}
                        initialConnections={flowData.connections}
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
                            value={checklistName}
                            onChange={(e) => setChecklistName(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Description:</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <div className="questions-group">
                        {renderQuestions()}
                    </div>
                    <div className="buttons-group">
                        <button onClick={handleSubmit} disabled={checklistId && !hasChanges()} className={`submit-btn ${checklistId && !hasChanges() ? 'disabled' : ''}`}>
                            Save Changes
                        </button>
                        <button onClick={() => navigate('/checklists')} className="cancel-btn">
                            Back to List
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChecklistEditor;