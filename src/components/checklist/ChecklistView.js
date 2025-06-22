import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import DecisionFlowTool from './DecisionFlowTool';
import api from '../api.js'



const ChecklistView = () => {

    const [flowData, setFlowData] = useState({});
    const [flowchartData, setFlowchartData] = useState('');
    const [questions, setQuestions] = useState([]);
    const [expandedQuestions, setExpandedQuestions] = useState({});
    const flowchartRef = useRef(null);
    const flowchartToolRef = useRef(null);
    const { checklistId } = useParams();
    const location = useLocation();
    const { isPlatform } = location.state || {};

    useEffect(() => {
        const fetchChecklistDetails = async () => {
            try {
                const endpoint = isPlatform
                    ? `/platform_checklists/${checklistId}`
                    : `/checklists/${checklistId}`;
                const response = await api.get(endpoint);
                const questions = response.data.questions;
                setQuestions(questions);
                setFlowchartData(response.data.mermaid_code);
                // 尝试解析mermaid_code字段，它现在存储的是流程图数据的JSON字符串
                if (response.data.mermaid_code) {
                    try {
                        const parsedFlowData = JSON.parse(response.data.mermaid_code);
                        setFlowData(parsedFlowData);
                        setTimeout(() => {
                            if (flowData.nodes?.length > 0 && flowchartToolRef.current) {
                                centerView();
                            }
                        }, 100);
                    } catch (e) {
                        console.error('Failed to parse flow data', e);
                        // 如果解析失败，使用空数据
                        setFlowData({ nodes: [], connections: [] });
                    }
                } else {
                    setFlowData({ nodes: [], connections: [] });
                }
            } catch (error) {
                console.error('Error fetching checklist details', error);
            }
        };
        fetchChecklistDetails();
    }, [checklistId]);

    // 计算并居中所有节点的视图
    const centerView = useCallback(() => {
        if (!flowchartToolRef.current || flowData.nodes.length === 0) return;

        // 计算所有节点的边界
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        flowData.nodes.forEach(node => {
            minX = Math.min(minX, node.x);
            minY = Math.min(minY, node.y);
            maxX = Math.max(maxX, node.x + node.width);
            maxY = Math.max(maxY, node.y + node.height);
        });

        // 添加边距
        const padding = 100;
        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;

        // 计算需要的缩放比例
        const containerWidth = flowchartRef.current?.clientWidth || 800;
        const containerHeight = flowchartRef.current?.clientHeight || 600;
        const scaleX = containerWidth / (maxX - minX);
        const scaleY = containerHeight / (maxY - minY);
        const scale = Math.min(scaleX, scaleY, 1); // 不超过100%缩放

        // 计算居中位置
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const translateX = containerWidth / 2 - centerX * scale;
        const translateY = containerHeight / 2 - centerY * scale;

        // 应用变换
        flowchartToolRef.current.setCanvasTransformTool({
            translateX,
            translateY,
            scale
        });

    }, [flowData]);

    // 切换问题展开状态
    const toggleQuestion = (questionId) => {
        setExpandedQuestions(prev => ({
            ...prev,
            [questionId]: !prev[questionId]
        }));
    };

    // 获取问题的子问题
    const getChildQuestions = (question, optionIndex) => {
        if (!question.follow_up_questions) return [];
        const childIds = question.follow_up_questions[optionIndex] || [];
        return questions.filter(q => childIds.includes(q.id));
    };

    return (
        <div>
            <h3>Flowchart:</h3>
            {flowchartData && (
                <div ref={flowchartRef}
                    style={{
                        height: '700px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        overflow: 'auto',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        position: 'relative'
                    }}>

                    <DecisionFlowTool
                        ref={flowchartToolRef}
                        readOnly={true}
                        initialNodes={flowData.nodes}
                        initialConnections={flowData.connections}
                    />

                </div>

            )}
            <div>
                <h3 style={{ margin: '20px auto' }}>Checklist Questions:</h3>
                <div className="question-tree">
                    {questions
                        .filter(q => !q.parent_id) // 只显示根问题
                        .map((question) => (
                            <div key={question.id} className="question-node">
                                <div
                                    className="question-header"
                                    onClick={() => toggleQuestion(question.id)}
                                >
                                    <span className="toggle-icon">
                                        {expandedQuestions[question.id] ? '▼' : '▶'}
                                    </span>
                                    {question.question}
                                    {question.type === 'choice' && (
                                        <span className="question-type">(选择题)</span>
                                    )}
                                </div>

                                {expandedQuestions[question.id] && (
                                    <div className="question-details">
                                        {question.type === 'choice' ? (
                                            <div className="options-container">
                                                {question.options.map((option, optIndex) => (
                                                    <div key={optIndex} className="option-branch">
                                                        <div className="option-header">
                                                            {option}
                                                        </div>
                                                        <div className="child-questions">
                                                            {getChildQuestions(question, optIndex).map(child => (
                                                                <div key={child.id} className="child-question">
                                                                    {child.question}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-question-desc">
                                                {question.description}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                </div>
            </div>

            <Link
                to="/checklists"
                style={{
                    display: 'inline-block',
                    margin: '30px auto',
                    padding: '10px 20px',
                    background: '#3498db',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                    ':hover': {
                        background: '#2980b9',
                        transform: 'translateY(-2px)'
                    }
                }}
            >
                ← 返回列表
            </Link>

        </div>

    );

}

export default ChecklistView