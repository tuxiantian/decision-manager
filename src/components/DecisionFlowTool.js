import React, { useState, useRef, useEffect } from 'react';
import './DecisionFlowTool.css'
const DecisionFlowTool = ({
    initialNodes = [],
    initialConnections = [],
    onFlowChange = () => { },
    readOnly = false  // 添加 readOnly 属性
}) => {
    const [nodes, setNodes] = useState(initialNodes);
    const [connections, setConnections] = useState(initialConnections);
    const [activeNodeId, setActiveNodeId] = useState(null);
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [selectedConnectionId, setSelectedConnectionId] = useState(null);
    const [draggingNodeId, setDraggingNodeId] = useState(null);
    const [connectingStart, setConnectingStart] = useState(null);
    const [selectedTool, setSelectedTool] = useState('select');
    const [hoveredAnchor, setHoveredAnchor] = useState(null);
    const [notification, setNotification] = useState(null);
    const [deletedItems, setDeletedItems] = useState(null);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [dragStartPos, setDragStartPos] = useState(null);
    const stageRef = useRef(null);
    const textareaRefs = useRef({});
    const fileInputRef = useRef(null);
    const containerRef = useRef(null);

    // 节点计数器
    const nodeCounter = useRef(1);

    // 添加状态变化回调
    useEffect(() => {
        if (onFlowChange) {
            onFlowChange(nodes, connections);
        }
    }, [nodes, connections, onFlowChange]);

    // 添加只读模式处理逻辑
    useEffect(() => {
        if (readOnly) {
            // 只读模式下禁用所有编辑工具
            setSelectedTool('select');

            // 清除所有选中状态
            setSelectedNodeId(null);
            setSelectedConnectionId(null);
            setActiveNodeId(null);
            setConnectingStart(null);
        }
    }, [readOnly]);
    // 在组件挂载时初始化计数器
    useEffect(() => {
        if (initialNodes?.length > 0) {
            // 找到最大的节点序号
            const maxNodeNumber = initialNodes.reduce((max, node) => {
                return node.nodeNumber > max ? node.nodeNumber : max;
            }, 0);

            nodeCounter.current = maxNodeNumber + 1;
        }
    }, [initialNodes]); // 依赖 initialNodes
    // 显示通知
    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    // 进入全屏模式
    const enterFullScreen = () => {
        const element = containerRef.current;
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }
    };

    // 退出全屏模式
    const exitFullScreen = () => {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    };

    // 切换全屏状态
    const toggleFullScreen = () => {
        if (isFullScreen) {
            exitFullScreen();
        } else {
            enterFullScreen();
        }
    };

    // 监听全屏变化
    useEffect(() => {
        const handleFullScreenChange = () => {
            setIsFullScreen(!!(
                document.fullscreenElement ||
                document.mozFullScreenElement ||
                document.webkitFullscreenElement ||
                document.msFullscreenElement
            ));
        };

        document.addEventListener('fullscreenchange', handleFullScreenChange);
        document.addEventListener('mozfullscreenchange', handleFullScreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullScreenChange);
        document.addEventListener('msfullscreenchange', handleFullScreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullScreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullScreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullScreenChange);
            document.removeEventListener('msfullscreenchange', handleFullScreenChange);
        };
    }, []);

    // 保存数据
    const saveData = () => {
        try {
            const flowData = { nodes, connections };
            localStorage.setItem('decisionFlowData', JSON.stringify(flowData));
            showNotification('数据保存成功！');
        } catch (error) {
            showNotification('保存失败: ' + error.message, 'error');
        }
    };

    // 加载本地数据
    const loadLocalData = () => {
        try {
            const savedData = localStorage.getItem('decisionFlowData');
            if (savedData) {
                const parsedData = JSON.parse(savedData);

                // 使用 nodeNumber 而非解析 ID
                const maxNodeNumber = parsedData.nodes.reduce((max, node) =>
                    node.nodeNumber > max ? node.nodeNumber : max
                    , 0);

                nodeCounter.current = maxNodeNumber + 1;

                setNodes(parsedData.nodes || []);
                setConnections(parsedData.connections || []);
                setActiveNodeId(null);
                setSelectedNodeId(null);
                setSelectedConnectionId(null);
                showNotification('数据加载成功！');
            } else {
                showNotification('没有找到保存的数据', 'info');
            }
        } catch (error) {
            showNotification('加载失败: ' + error.message, 'error');
        }
    };

    // 重置画布
    const resetCanvas = () => {
        if (window.confirm('确定要重置画布吗？所有未保存的数据将会丢失！')) {
            setNodes([]);
            setConnections([]);
            setActiveNodeId(null);
            setSelectedNodeId(null);
            setSelectedConnectionId(null);
            nodeCounter.current = 1;
            localStorage.removeItem('decisionFlowData');
            showNotification('画布已重置', 'info');
        }
    };

    // 导出数据
    const exportData = () => {
        try {
            const flowData = { nodes, connections };
            const dataStr = JSON.stringify(flowData, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

            const exportFileDefaultName = '决策流程图.json';

            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();

            showNotification('数据导出成功！');
        } catch (error) {
            showNotification('导出失败: ' + error.message, 'error');
        }
    };

    // 导入数据
    const importData = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target.result;
                const importedData = JSON.parse(content);

                // 验证数据格式
                if (!Array.isArray(importedData.nodes)) {
                    throw new Error('无效的数据格式: 缺少节点数据');
                }

                // 使用 nodeNumber 而非解析 ID
                const maxNodeNumber = importedData.nodes.reduce((max, node) =>
                    node.nodeNumber > max ? node.nodeNumber : max
                    , 0);

                nodeCounter.current = maxNodeNumber + 1;

                setNodes(importedData.nodes || []);
                setConnections(importedData.connections || []);
                setActiveNodeId(null);
                setSelectedNodeId(null);
                setSelectedConnectionId(null);

                // 保存到本地存储
                localStorage.setItem('decisionFlowData', JSON.stringify(importedData));

                showNotification('数据导入成功！');
            } catch (error) {
                showNotification('导入失败: ' + error.message, 'error');
            }

            // 重置文件输入
            e.target.value = null;
        };

        reader.readAsText(file);
    };

    // 创建新节点
    const addNode = (e) => {
        if (readOnly) return; // 只读模式下禁止添加节点
        // 点击节点时不要创建新节点
        if (e.target !== stageRef.current) return;

        // 如果当前有选中节点或连线，点击画布空白处取消选中
        if (selectedNodeId || selectedConnectionId) {
            setSelectedNodeId(null);
            setSelectedConnectionId(null);
            return;
        }

        if (selectedTool !== 'text') return;

        const rect = stageRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // 创建新节点
        const nodeId = `node-${nodeCounter.current}`;
        const newNode = {
            id: nodeId,
            x,
            y,
            width: 200,
            height: 60,
            text: '双击编辑内容',
            nodeNumber: nodeCounter.current
        };

        // 增加节点计数器
        nodeCounter.current += 1;

        setNodes([...nodes, newNode]);
        setSelectedNodeId(nodeId);
    };

    // 删除选中的节点及其相关连接
    const deleteSelectedNode = () => {
        if (readOnly) return; // 只读模式下禁止编辑文本

        if (!selectedNodeId) return;

        // 确认删除
        const nodeNumber = nodes.find(n => n.id === selectedNodeId)?.nodeNumber;
        if (!window.confirm(`确定要删除节点 #${nodeNumber} 及其所有连接吗？`)) {
            return;
        }

        // 保存当前状态用于可能的撤销操作
        setDeletedItems({
            nodes: [...nodes],
            connections: [...connections],
            selectedNodeId,
            selectedConnectionId
        });

        // 删除节点
        const newNodes = nodes.filter(node => node.id !== selectedNodeId);

        // 删除与该节点相关的所有连接
        const newConnections = connections.filter(conn =>
            conn.from.nodeId !== selectedNodeId && conn.to.nodeId !== selectedNodeId
        );

        setNodes(newNodes);
        setConnections(newConnections);
        setSelectedNodeId(null);
        setActiveNodeId(null);

        showNotification(`已删除节点 #${nodeNumber}`, 'info');
    };

    // 删除选中的连接
    const deleteSelectedConnection = () => {
        if (readOnly) return; // 只读模式下禁止编辑文本

        if (!selectedConnectionId) return;

        // 保存当前状态用于可能的撤销操作
        setDeletedItems({
            nodes: [...nodes],
            connections: [...connections],
            selectedNodeId,
            selectedConnectionId
        });

        // 删除连接
        const newConnections = connections.filter(conn => conn.id !== selectedConnectionId);
        setConnections(newConnections);
        setSelectedConnectionId(null);

        showNotification('已删除连接', 'info');
    };

    // 撤销删除操作
    const undoDelete = () => {
        if (!deletedItems) return;

        setNodes(deletedItems.nodes);
        setConnections(deletedItems.connections);
        setSelectedNodeId(deletedItems.selectedNodeId);
        setSelectedConnectionId(deletedItems.selectedConnectionId);
        setDeletedItems(null);

        showNotification('已撤销删除操作', 'info');
    };

    // 开始连接
    const startConnection = (nodeId, anchorPosition) => {
        if (readOnly || selectedTool !== 'arrow') return;
        setConnectingStart({ nodeId, anchorPosition });
    };

    // 完成连接
    const endConnection = (e) => {
        if (!connectingStart || selectedTool !== 'arrow') return;

        if (hoveredAnchor && hoveredAnchor.nodeId !== connectingStart.nodeId) {
            const newConnection = {
                id: `conn-${Date.now()}`,
                from: connectingStart,
                to: { nodeId: hoveredAnchor.nodeId, anchorPosition: hoveredAnchor.position },
            };
            setConnections([...connections, newConnection]);
        }

        setConnectingStart(null);
        setHoveredAnchor(null);
    };

    // 处理节点拖拽
    const handleNodeDrag = (e, nodeId) => {
        if (readOnly || e.buttons !== 1) return; // 只读模式下禁止拖拽节点
        // 允许在select和arrow工具下拖拽
        if (selectedTool !== 'select' && selectedTool !== 'arrow') return;
        const rect = stageRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        console.log(e.buttons);
        setNodes(nodes.map(node =>
            node.id === nodeId ? { ...node, x, y } : node
        ));
    };

    // 更新节点文本
    const updateNodeText = (nodeId, newText) => {
        if (readOnly) return; // 只读模式下禁止编辑文本

        setNodes(nodes.map(node =>
            node.id === nodeId ? { ...node, text: newText } : node
        ));
    };

    // 计算锚点位置
    const getAnchorPosition = (node, position) => {
        switch (position) {
            case 'top': return { x: node.x + node.width / 2, y: node.y };
            case 'right': return { x: node.x + node.width, y: node.y + node.height / 2 };
            case 'bottom': return { x: node.x + node.width / 2, y: node.y + node.height };
            case 'left': return { x: node.x, y: node.y + node.height / 2 };
            default: return { x: node.x, y: node.y };
        }
    };

    // 聚焦文本输入框
    useEffect(() => {
        if (activeNodeId && textareaRefs.current[activeNodeId]) {
            const textarea = textareaRefs.current[activeNodeId];

            // 使用requestAnimationFrame确保DOM更新完成
            requestAnimationFrame(() => {
                textarea.focus();
                const length = textarea.value.length;
                textarea.setSelectionRange(length, length);
            });
        }
    }, [activeNodeId]);

    // 查找鼠标位置附近的锚点
    const findAnchorAtPosition = (x, y) => {
        const threshold = 10;

        for (const node of nodes) {
            for (const position of ['top', 'right', 'bottom', 'left']) {
                const anchorPos = getAnchorPosition(node, position);
                const distance = Math.sqrt(
                    Math.pow(anchorPos.x - x, 2) +
                    Math.pow(anchorPos.y - y, 2)
                );

                if (distance < threshold) {
                    return { nodeId: node.id, position };
                }
            }
        }

        return null;
    };

    // 处理键盘事件
    useEffect(() => {
        const handleKeyDown = (e) => {
            // 按下Delete键删除选中节点或连接
            if (e.key === 'Delete') {
                if (selectedNodeId) {
                    deleteSelectedNode();
                } else if (selectedConnectionId) {
                    deleteSelectedConnection();
                }
                e.preventDefault();
            }

            // Ctrl+Z撤销删除操作
            if (e.ctrlKey && e.key === 'z' && deletedItems) {
                undoDelete();
                e.preventDefault();
            }

            // 按下Esc键退出编辑状态
            if (e.key === 'Escape') {
                if (activeNodeId) {
                    setActiveNodeId(null);
                } else {
                    setSelectedNodeId(null);
                    setSelectedConnectionId(null);
                }

                // 如果全屏，按ESC退出全屏
                if (isFullScreen) {
                    exitFullScreen();
                }
            }

            // F11键切换全屏
            if (e.key === 'F11') {
                e.preventDefault();
                toggleFullScreen();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedNodeId, selectedConnectionId, activeNodeId, deletedItems, isFullScreen]);

    // 保存按钮样式
    const getButtonStyle = (isActive = false, color = null) => ({
        padding: '6px 12px',
        backgroundColor: color || (isActive ? '#4a90e2' : 'white'),
        border: '1px solid #ddd',
        borderRadius: '4px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        transition: 'all 0.2s',
        fontSize: '13px', // 减小字体
        ':hover': {
            backgroundColor: color ? `${color}cc` : (isActive ? '#3a7bc8' : '#f5f5f5')
        }
    });

    return (
        <div
            ref={containerRef}
            className='decision-flow-container'
            style={{
                backgroundColor: isFullScreen ? '#1e1e1e' : 'white'
            }}
        >
            {/* 顶部操作栏 */}
            {!readOnly && (
                <div className="toolbar-top">
                    <div style={{ fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                        <i className="fas fa-project-diagram" style={{ marginRight: '8px', fontSize: '16px' }}></i>
                        决策流程图工具
                        {isFullScreen && (
                            <span style={{
                                marginLeft: '12px',
                                fontSize: '12px',
                                backgroundColor: '#4a90e2',
                                padding: '2px 6px',
                                borderRadius: '4px'
                            }}>
                                全屏模式中 - 按ESC退出
                            </span>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            style={getButtonStyle()}
                            onClick={saveData}
                        >
                            <i className="fas fa-save" style={{ fontSize: '12px' }}></i>
                            保存
                        </button>
                        <button
                            style={getButtonStyle()}
                            onClick={loadLocalData}
                        >
                            <i className="fas fa-folder-open" style={{ fontSize: '12px' }}></i>
                            加载
                        </button>
                        <button
                            style={getButtonStyle()}
                            onClick={exportData}
                        >
                            <i className="fas fa-file-export" style={{ fontSize: '12px' }}></i>
                            导出
                        </button>
                        <button
                            style={getButtonStyle()}
                            onClick={() => fileInputRef.current.click()}
                        >
                            <i className="fas fa-file-import" style={{ fontSize: '12px' }}></i>
                            导入
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept=".json"
                                onChange={importData}
                            />
                        </button>
                        {deletedItems && (
                            <button
                                style={getButtonStyle(false, '#ff9f43')}
                                onClick={undoDelete}
                            >
                                <i className="fas fa-undo" style={{ fontSize: '12px' }}></i>
                                撤销删除
                            </button>
                        )}
                        <button
                            style={{ ...getButtonStyle(false, '#e74c3c'), color: 'white' }}
                            onClick={resetCanvas}
                        >
                            <i className="fas fa-trash-alt" style={{ fontSize: '12px' }}></i>
                            重置
                        </button>
                        <button
                            style={{ ...getButtonStyle(false, isFullScreen ? '#4a90e2' : '#2ecc71'), color: 'white' }}
                            onClick={toggleFullScreen}
                        >
                            <i className={`fas ${isFullScreen ? 'fa-compress' : 'fa-expand'}`} style={{ fontSize: '12px' }}></i>
                            {isFullScreen ? '退出全屏' : '全屏模式'}
                        </button>
                    </div>
                </div>
            )}

            {/* 工具栏 */}
            {!readOnly && (
                <div className='toolbar-main'>
                    <button
                        className='tool-button'
                        style={{
                            backgroundColor: selectedTool === 'select' ? '#4a90e2' : 'white'
                        }}
                        onClick={() => setSelectedTool('select')}
                    >
                        <i className="fas fa-mouse-pointer" style={{ fontSize: '12px' }}></i>
                        选择
                    </button>
                    <button
                        className='tool-button'
                        style={{
                            backgroundColor: selectedTool === 'text' ? '#4a90e2' : 'white',
                        }}
                        onClick={() => setSelectedTool('text')}
                    >
                        <i className="fas fa-font" style={{ fontSize: '12px' }}></i>
                        文本
                    </button>
                    <button
                        className='tool-button'
                        style={{
                            backgroundColor: selectedTool === 'arrow' ? '#4a90e2' : 'white',
                        }}
                        onClick={() => setSelectedTool('arrow')}
                    >
                        <i className="fas fa-arrow-right" style={{ fontSize: '12px' }}></i>
                        箭头
                    </button>

                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', color: '#555', fontSize: '14px' }}>
                            <i className="fas fa-info-circle" style={{ marginRight: '4px', fontSize: '12px' }}></i>
                            节点: {nodes.length} | 连接: {connections.length}
                        </div>
                        {selectedNodeId && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ color: '#555', fontSize: '12px' }}>
                                    选中节点: <span style={{ fontWeight: 'bold' }}>#{nodes.find(n => n.id === selectedNodeId)?.nodeNumber}</span>
                                </div>
                                <button
                                className='delete-button'
                                    onClick={deleteSelectedNode}
                                >
                                    <i className="fas fa-trash" style={{ fontSize: '10px' }}></i>
                                    删除节点
                                </button>
                            </div>
                        )}
                        {selectedConnectionId && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ color: '#555', fontSize: '12px' }}>
                                    选中连接
                                </div>
                                <button className='delete-button'                                   
                                    onClick={deleteSelectedConnection}
                                >
                                    <i className="fas fa-trash" style={{ fontSize: '10px' }}></i>
                                    删除连接
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* 画布 */}
            <div
                ref={stageRef}
                style={{
                    flex: 1,
                    border: isFullScreen ? 'none' : '1px solid #ddd',
                    position: 'relative',
                    overflow: 'auto',
                    backgroundColor: isFullScreen ? '#1a1a1a' : '#f9f9f9',
                    backgroundImage: isFullScreen
                        ? 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)'
                        : 'linear-gradient(#eee 1px, transparent 1px), linear-gradient(90deg, #eee 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                    cursor: connectingStart ? 'crosshair' : selectedTool === 'text' ? 'text' : 'default',
                    transition: 'background-color 0.3s',
                    cursor: readOnly ? 'default' : (
                        connectingStart ? 'crosshair' : selectedTool === 'text' ? 'text' : 'default')
                }}
                onClick={addNode}
                onMouseMove={(e) => {
                    const rect = stageRef.current.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;

                    if (draggingNodeId && e.buttons === 1) {
                        const dx = Math.abs(e.clientX - dragStartPos.x);
                        const dy = Math.abs(e.clientY - dragStartPos.y);
                        // 移动超过5px才认为是拖拽
                        if (dx > 5 || dy > 5) {
                            handleNodeDrag(e, draggingNodeId);
                        }
                    }

                    if (connectingStart) {
                        setConnectingStart(prev => ({ ...prev, currentX: x, currentY: y }));
                        const foundAnchor = findAnchorAtPosition(x, y);
                        setHoveredAnchor(foundAnchor);
                    }
                }}
                onMouseUp={(e) => {
                    setDraggingNodeId(null);
                    if (connectingStart) {
                        endConnection(e);
                    }
                }}
            >
                {/* 通知消息 */}
                {notification && (
                    <div className='notification' style={{   
                        backgroundColor: notification.type === 'error' ? '#e74c3c' :
                            notification.type === 'info' ? '#3498db' : '#2ecc71',                    
                    }}>
                        {notification.type === 'error' && <i className="fas fa-exclamation-circle"></i>}
                        {notification.type === 'info' && <i className="fas fa-info-circle"></i>}
                        {notification.type === 'success' && <i className="fas fa-check-circle"></i>}
                        {notification.message}
                    </div>
                )}

                {/* 操作提示 */}
                {(selectedNodeId || selectedConnectionId) && (
                    <div className='selection-hint'>
                        <i className="fas fa-exclamation-triangle"></i>
                        {selectedNodeId ?
                            `已选中节点 #${nodes.find(n => n.id === selectedNodeId)?.nodeNumber}，按Delete键或点击工具栏删除按钮可删除` :
                            '已选中连接，按Delete键或点击工具栏删除按钮可删除'}
                    </div>
                )}

                {/* 箭头标记定义 */}
                <svg style={{ height: 0, width: 0 }}>
                    <defs>
                        <marker
                            id="arrowhead"
                            markerWidth="10"
                            markerHeight="7"
                            refX="9"
                            refY="3.5"
                            orient="auto"
                        >
                            <polygon points="0 0, 10 3.5, 0 7" fill={isFullScreen ? "#fff" : "#333"} />
                        </marker>
                    </defs>
                </svg>

                {/* 渲染节点 */}
                {nodes.map(node => (
                    <div
                        key={node.id}
                        style={{
                            cursor: readOnly ? 'default' : (
                                selectedTool === 'select' || selectedTool === 'arrow' ? 'move' : 'default'),
                            position: 'absolute',
                            left: `${node.x}px`,
                            top: `${node.y}px`,
                            width: `${node.width}px`,
                            minHeight: `${node.height}px`,
                            border: selectedNodeId === node.id
                                ? '3px solid #e74c3c'
                                : activeNodeId === node.id
                                    ? '2px solid #4a90e2'
                                    : isFullScreen ? '1px solid #555' : '1px solid #bbb',
                            borderRadius: '8px',
                            padding: '12px',
                            backgroundColor: isFullScreen ? '#2a2a2a' : '#ffffff',
                            boxShadow: selectedNodeId === node.id
                                ? '0 0 15px rgba(231, 76, 60, 0.4)'
                                : activeNodeId === node.id
                                    ? '0 0 10px rgba(74, 144, 226, 0.3)'
                                    : '0 3px 8px rgba(0,0,0,0.1)',
                            cursor: selectedTool === 'select' || selectedTool === 'arrow' ? 'move' : 'default',
                            zIndex: (selectedNodeId === node.id || activeNodeId === node.id) ? 100 : 1,
                            transition: 'all 0.3s',
                            ':hover': {
                                boxShadow: '0 5px 15px rgba(0,0,0,0.15)',
                                borderColor: selectedNodeId === node.id
                                    ? '#e74c3c'
                                    : activeNodeId === node.id
                                        ? '#4a90e2'
                                        : isFullScreen ? '#777' : '#999'
                            }
                        }}
                        onMouseDown={(e) => {
                            if (readOnly) return; // 只读模式下禁止交互
                            // 编辑状态下阻止拖拽
                            if (activeNodeId === node.id) {
                                return;
                            }
                            setDragStartPos({ x: e.clientX, y: e.clientY });
                            e.stopPropagation();
                            e.preventDefault();
                            setDraggingNodeId(node.id);
                            setSelectedNodeId(node.id);
                            setSelectedConnectionId(null);
                        }}
                        onDoubleClick={(e) => {
                            if (readOnly) return; // 只读模式下禁止交互
                            e.stopPropagation();
                            e.preventDefault();
                            setActiveNodeId(node.id);
                            setSelectedNodeId(null);
                            setSelectedConnectionId(null);
                        }}
                    >
                        {/* 文本编辑区域 */}
                        {activeNodeId === node.id ? (
                            <textarea
                                ref={(el) => {
                                    textareaRefs.current[node.id] = el;
                                    if (el && activeNodeId === node.id) {
                                        // 立即尝试聚焦
                                        requestAnimationFrame(() => {
                                            el.focus();
                                            const length = el.value.length;
                                            el.setSelectionRange(length, length);
                                        });
                                    }
                                }}
                                value={node.text}
                                onChange={(e) => updateNodeText(node.id, e.target.value)}
                                onBlur={() => setActiveNodeId(null)}
                                className='node-textarea'
                                style={{                          
                                    color: isFullScreen ? '#fff' : '#000'
                                }}
                                readOnly={readOnly}
                                autoFocus
                                onMouseDown={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <div
                            className='node-text-display'
                                style={{                                
                                    color: isFullScreen ? '#fff' : '#000'
                                }}
                            >
                                {node.text}
                            </div>
                        )}

                        {/* 节点序号标签 */}
                        <div className='node-number' style={{
                            backgroundColor: selectedNodeId === node.id
                                ? '#e74c3c'
                                : activeNodeId === node.id
                                    ? '#4a90e2'
                                    : isFullScreen ? '#555' : '#777',

                        }}>
                            #{node.nodeNumber}
                        </div>

                        {/* 锚点 */}
                        {!readOnly && (selectedTool === 'select' || selectedTool === 'arrow') && (
                            <>
                                {['top', 'right', 'bottom', 'left'].map(position => (
                                    <div
                                        key={position}
                                        style={{
                                            position: 'absolute',
                                            width: '12px',
                                            height: '12px',
                                            borderRadius: '50%',
                                            backgroundColor: hoveredAnchor?.nodeId === node.id &&
                                                hoveredAnchor?.position === position
                                                ? '#ff6b6b' : '#4a90e2',
                                            cursor: 'crosshair',
                                            border: '1px solid white',
                                            boxShadow: '0 0 3px rgba(0,0,0,0.3)',
                                            transition: 'transform 0.2s',
                                            ':hover': {
                                                transform: 'scale(1.3)'
                                            },
                                            ...(position === 'top' && {
                                                left: '50%',
                                                top: '-6px',
                                                transform: 'translateX(-50%)',
                                            }),
                                            ...(position === 'right' && {
                                                right: '-6px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                            }),
                                            ...(position === 'bottom' && {
                                                left: '50%',
                                                bottom: '-6px',
                                                transform: 'translateX(-50%)',
                                            }),
                                            ...(position === 'left' && {
                                                left: '-6px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                            }),
                                        }}
                                        onMouseDown={(e) => {
                                            e.stopPropagation();
                                            startConnection(node.id, position);
                                        }}
                                    />
                                ))}
                            </>
                        )}
                    </div>
                ))}

                {/* 渲染连接线（放在节点后面，确保节点可以点击） */}
                {connections.map(conn => {
                    const fromNode = nodes.find(n => n.id === conn.from.nodeId);
                    const toNode = nodes.find(n => n.id === conn.to.nodeId);

                    if (!fromNode || !toNode) return null;

                    const start = getAnchorPosition(fromNode, conn.from.anchorPosition);
                    const end = getAnchorPosition(toNode, conn.to.anchorPosition);

                    return (
                        <svg
                            key={conn.id}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                pointerEvents: 'none',
                                zIndex: 10 // 确保连接线在节点上方
                            }}
                        >
                            <line
                                x1={start.x}
                                y1={start.y}
                                x2={end.x}
                                y2={end.y}
                                stroke={selectedConnectionId === conn.id ? "#e74c3c" : (isFullScreen ? "#fff" : "#333")}
                                strokeWidth={selectedConnectionId === conn.id ? "4" : "2"}
                                markerEnd="url(#arrowhead)"
                                onClick={(e) => {
                                    if (readOnly) return; // 只读模式下禁止选择
                                    e.stopPropagation();
                                    setSelectedConnectionId(conn.id);
                                    setSelectedNodeId(null);
                                }}
                                style={{ cursor: readOnly ? 'default' : 'pointer', pointerEvents: readOnly ? 'none' : 'visibleStroke' }}
                            />
                        </svg>
                    );
                })}

                {/* 正在创建的连接线 */}
                {connectingStart && (
                    <svg
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            pointerEvents: 'none',
                            zIndex: 20,
                        }}
                    >
                        <line
                            x1={getAnchorPosition(
                                nodes.find(n => n.id === connectingStart.nodeId),
                                connectingStart.anchorPosition
                            ).x}
                            y1={getAnchorPosition(
                                nodes.find(n => n.id === connectingStart.nodeId),
                                connectingStart.anchorPosition
                            ).y}
                            x2={connectingStart.currentX || 0}
                            y2={connectingStart.currentY || 0}
                            stroke={isFullScreen ? "#fff" : "#333"}
                            strokeWidth="2"
                            markerEnd="url(#arrowhead)"
                        />
                    </svg>
                )}

                {/* 空状态提示 */}
                {nodes.length === 0 && !readOnly && (
                    <div className='empty-state' style={{
                        color: isFullScreen ? '#aaa' : '#888',
                    }}>
                        <i className="fas fa-project-diagram" style={{ fontSize: '48px', marginBottom: '20px' }}></i>
                        <h2>欢迎使用决策流程图工具</h2>
                        <p style={{ margin: '15px 0', lineHeight: '1.6' }}>
                            请选择上方的"文本"工具开始创建节点，或使用"箭头"工具连接节点。<br />
                            您也可以点击"加载"按钮恢复之前保存的工作。
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
                            <button style={getButtonStyle()} onClick={() => setSelectedTool('text')}>
                                <i className="fas fa-font"></i> 创建节点
                            </button>
                            <button style={getButtonStyle()} onClick={loadLocalData}>
                                <i className="fas fa-folder-open"></i> 加载数据
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* 页脚信息 */}
            {!isFullScreen && !readOnly && (
                <div className='footer'>
                    <div>
                        提示：选中节点或连线后按Delete键可删除 | Ctrl+Z撤销删除操作 | Esc取消选择 | F11全屏
                    </div>
                    <div className='footer-copyright'>
                        决策流程图工具 v1.5 &copy; {new Date().getFullYear()}
                    </div>
                </div>
            )}

            {/* Font Awesome 图标 */}
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" />


        </div>
    );
};

export default DecisionFlowTool;