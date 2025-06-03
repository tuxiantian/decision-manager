import React, { useState, useRef, useEffect, useImperativeHandle } from 'react';
import './DecisionFlowTool.css'
const DecisionFlowTool = React.forwardRef(({
    initialNodes = [],
    initialConnections = [],
    onFlowChange = () => { },
    readOnly = false  // 添加 readOnly 属性
}, ref) => {
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
    const [canvasTransform, setCanvasTransform] = useState({
        translateX: 0,
        translateY: 0,
        scale: 1
    });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const stageRef = useRef(null);
    const textareaRefs = useRef({});
    const fileInputRef = useRef(null);
    const containerRef = useRef(null);
    const [showSelectionHint, setShowSelectionHint] = useState(false);
    useEffect(() => {
        if (selectedNodeId || selectedConnectionId) {
            setShowSelectionHint(true);
            const timer = setTimeout(() => {
                setShowSelectionHint(false);
            }, 2000); // 2秒后自动隐藏

            return () => clearTimeout(timer); // 清除定时器防止内存泄漏
        } else {
            setShowSelectionHint(false); // 取消选中时立即隐藏
        }
    }, [selectedNodeId, selectedConnectionId]);

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

    // 在DecisionFlowTool组件中添加这个方法
    const setCanvasTransformTool = (transform) => {
        setCanvasTransform(transform);
    };

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
        resetView: () => {
            setCanvasTransform({
                translateX: 0,
                translateY: 0,
                scale: 1
            });
        },
        setCanvasTransformTool
    }));

    // 新增函数：检测路径是否穿过其他节点
    const doesPathIntersectNode = (start, end, nodes, excludeIds = []) => {
        // 简化的线段与矩形相交检测
        for (const node of nodes) {
            if (excludeIds.includes(node.id)) continue;

            // 节点边界
            const left = node.x;
            const right = node.x + node.width;
            const top = node.y;
            const bottom = node.y + node.height;

            // 线段与矩形相交检测算法
            if (lineIntersectsRect(start, end, { left, top, right, bottom })) {
                return true;
            }
        }
        return false;
    };

    // 线段与矩形相交检测算法
    const lineIntersectsRect = (start, end, rect) => {
        // 快速排斥实验
        if (Math.max(start.x, end.x) < rect.left ||
            Math.min(start.x, end.x) > rect.right ||
            Math.max(start.y, end.y) < rect.top ||
            Math.min(start.y, end.y) > rect.bottom) {
            return false;
        }

        // 跨立实验
        const cross = (a, b, c) => {
            return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
        };

        const p1 = { x: rect.left, y: rect.top };
        const p2 = { x: rect.right, y: rect.top };
        const p3 = { x: rect.right, y: rect.bottom };
        const p4 = { x: rect.left, y: rect.bottom };

        // 检查线段是否与矩形任一边相交
        if (cross(start, end, p1) * cross(start, end, p2) < 0 &&
            cross(p1, p2, start) * cross(p1, p2, end) < 0) {
            return true;
        }
        if (cross(start, end, p2) * cross(start, end, p3) < 0 &&
            cross(p2, p3, start) * cross(p2, p3, end) < 0) {
            return true;
        }
        if (cross(start, end, p3) * cross(start, end, p4) < 0 &&
            cross(p3, p4, start) * cross(p3, p4, end) < 0) {
            return true;
        }
        if (cross(start, end, p4) * cross(start, end, p1) < 0 &&
            cross(p4, p1, start) * cross(p4, p1, end) < 0) {
            return true;
        }

        // 检查线段是否完全在矩形内部
        if (start.x > rect.left && start.x < rect.right &&
            start.y > rect.top && start.y < rect.bottom) {
            return true;
        }

        return false;
    };

    // 两条线段相交检测
    const linesIntersect = (x1, y1, x2, y2, x3, y3, x4, y4) => {
        // 实现线段相交检测算法
        const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
        if (denom === 0) return false; // 平行

        const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
        const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

        return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
    };

    // 计算绕过节点的路径
    const calculatePath = (start, end, nodes, excludeIds = []) => {
        // 1. 检查直接路径是否可行
        if (!doesPathIntersectNode(start, end, nodes, excludeIds)) {
            return { points: [start, end], intersects: false };
        }

        // 2. 找出所有障碍节点
        const obstacles = nodes.filter(node =>
            !excludeIds.includes(node.id) &&
            lineIntersectsRect(start, end, {
                left: node.x,
                top: node.y,
                right: node.x + node.width,
                bottom: node.y + node.height
            })
        );

        // 3. 如果没有障碍(可能是误检)，返回直接路径
        if (obstacles.length === 0) {
            return { points: [start, end], intersects: false };
        }

        // 4. 对每个障碍物计算绕行路径
        let bestPath = null;
        let bestScore = Infinity;

        // 尝试多种绕行策略
        const strategies = [
            // 上方绕行
            () => {
                const topPoints = [];
                obstacles.forEach(obstacle => {
                    topPoints.push({ x: start.x, y: obstacle.y - 10 });
                    topPoints.push({ x: end.x, y: obstacle.y - 10 });
                });
                return [start, ...topPoints, end];
            },
            // 下方绕行
            () => {
                const bottomPoints = [];
                obstacles.forEach(obstacle => {
                    bottomPoints.push({ x: start.x, y: obstacle.y + obstacle.height + 10 });
                    bottomPoints.push({ x: end.x, y: obstacle.y + obstacle.height + 10 });
                });
                return [start, ...bottomPoints, end];
            },
            // 左侧绕行
            () => {
                const leftPoints = [];
                obstacles.forEach(obstacle => {
                    leftPoints.push({ x: obstacle.x - 10, y: start.y });
                    leftPoints.push({ x: obstacle.x - 10, y: end.y });
                });
                return [start, ...leftPoints, end];
            },
            // 右侧绕行
            () => {
                const rightPoints = [];
                obstacles.forEach(obstacle => {
                    rightPoints.push({ x: obstacle.x + obstacle.width + 10, y: start.y });
                    rightPoints.push({ x: obstacle.x + obstacle.width + 10, y: end.y });
                });
                return [start, ...rightPoints, end];
            },
            // 组合绕行 (上-右-下)
            () => {
                const midY = (start.y + end.y) / 2;
                const midX = (start.x + end.x) / 2;
                return [
                    start,
                    { x: start.x, y: midY - 20 },
                    { x: end.x, y: midY - 20 },
                    end
                ];
            },
            // 组合绕行 (左-下-右)
            () => {
                const midY = (start.y + end.y) / 2;
                const midX = (start.x + end.x) / 2;
                return [
                    start,
                    { x: midX - 20, y: start.y },
                    { x: midX - 20, y: end.y },
                    end
                ];
            }
        ];

        // 评估每种绕行策略
        strategies.forEach(strategy => {
            const candidatePath = strategy();
            let valid = true;
            let pathLength = 0;

            // 检查路径每一段是否有效
            for (let i = 0; i < candidatePath.length - 1; i++) {
                if (doesPathIntersectNode(candidatePath[i], candidatePath[i + 1], nodes, excludeIds)) {
                    valid = false;
                    break;
                }
                pathLength += Math.sqrt(
                    Math.pow(candidatePath[i + 1].x - candidatePath[i].x, 2) +
                    Math.pow(candidatePath[i + 1].y - candidatePath[i].y, 2)
                );
            }

            // 选择最短的有效路径
            if (valid && pathLength < bestScore) {
                bestScore = pathLength;
                bestPath = candidatePath;
            }
        });

        // 如果找到有效路径则返回，否则返回直接路径
        return bestPath
            ? { points: bestPath, intersects: true }
            : { points: [start, end], intersects: false };
    };

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

    // 画布平移和缩放功能
    const handleWheel = (e) => {
        if (e.ctrlKey) {
            // 缩放
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            const newScale = Math.min(Math.max(0.1, canvasTransform.scale + delta), 3);

            // 计算鼠标位置相对于画布的位置
            const rect = stageRef.current.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // 计算缩放中心点
            const scalePointX = (mouseX - canvasTransform.translateX) / canvasTransform.scale;
            const scalePointY = (mouseY - canvasTransform.translateY) / canvasTransform.scale;

            // 计算新的平移位置以保持缩放中心不变
            const newTranslateX = mouseX - scalePointX * newScale;
            const newTranslateY = mouseY - scalePointY * newScale;

            setCanvasTransform({
                translateX: newTranslateX,
                translateY: newTranslateY,
                scale: newScale
            });
        } else {
            // 平移
            e.preventDefault();
            setCanvasTransform(prev => ({
                ...prev,
                translateX: prev.translateX - e.deltaX,
                translateY: prev.translateY - e.deltaY
            }));
        }
    };

    const startPanning = (e) => {
        if (e.button !== 1 && e.button !== 2) return; // 只响应中键或右键
        e.preventDefault();
        setIsPanning(true);
        setPanStart({
            x: e.clientX - canvasTransform.translateX,
            y: e.clientY - canvasTransform.translateY
        });
    };

    const doPanning = (e) => {
        if (!isPanning) return;
        e.preventDefault();
        setCanvasTransform({
            ...canvasTransform,
            translateX: e.clientX - panStart.x,
            translateY: e.clientY - panStart.y
        });
    };

    const stopPanning = () => {
        setIsPanning(false);
    };

    const resetView = () => {
        setCanvasTransform({
            translateX: 0,
            translateY: 0,
            scale: 1
        });
    };

    const zoomIn = () => {
        setCanvasTransform(prev => ({
            ...prev,
            scale: Math.min(prev.scale + 0.1, 3)
        }));
    };

    const zoomOut = () => {
        setCanvasTransform(prev => ({
            ...prev,
            scale: Math.max(prev.scale - 0.1, 0.1)
        }));
    };

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
        // 点击节点时不要创建新节点
        if (readOnly || selectedTool !== 'text') return;
        // 如果点击的是节点元素，则不创建新节点
        if (e.target.closest('.node-text-display') || e.target.closest('textarea')) {
            return;
        }

        // 如果当前有选中节点或连线，点击画布空白处取消选中
        if (selectedNodeId || selectedConnectionId) {
            setSelectedNodeId(null);
            setSelectedConnectionId(null);

        }
        const rect = stageRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left - canvasTransform.translateX) / canvasTransform.scale;
        const y = (e.clientY - rect.top - canvasTransform.translateY) / canvasTransform.scale;

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

        const rect = stageRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const foundAnchor = findAnchorAtPosition(x, y);

        if (foundAnchor && foundAnchor.nodeId !== connectingStart.nodeId) {
            const newConnection = {
                id: `conn-${Date.now()}`,
                from: connectingStart,
                to: { nodeId: foundAnchor.nodeId, anchorPosition: foundAnchor.position },
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
        const x = (e.clientX - rect.left - canvasTransform.translateX) / canvasTransform.scale;
        const y = (e.clientY - rect.top - canvasTransform.translateY) / canvasTransform.scale;
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
            case 'top': return {
                x: node.x + node.width / 2,
                y: node.y
            };
            case 'right': return {
                x: node.x + node.width,
                y: node.y + node.height / 2
            };
            case 'bottom': return {
                x: node.x + node.width / 2,
                y: node.y + node.height
            };
            case 'left': return {
                x: node.x,
                y: node.y + node.height / 2
            };
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

    // 查找鼠标位置附近的锚点 (修改坐标计算以考虑画布变换)
    const findAnchorAtPosition = (x, y) => {
        const threshold = 15 / canvasTransform.scale;
        const worldX = (x - canvasTransform.translateX) / canvasTransform.scale;
        const worldY = (y - canvasTransform.translateY) / canvasTransform.scale;

        for (const node of nodes) {
            for (const position of ['top', 'right', 'bottom', 'left']) {
                const anchorPos = getAnchorPosition(node, position);

                const distance = Math.sqrt(
                    Math.pow(anchorPos.x - worldX, 2) +
                    Math.pow(anchorPos.y - worldY, 2)
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
            // 画布控制
            if (e.key === '0' && e.ctrlKey) {
                resetView();
                e.preventDefault();
            }
            if (e.key === '+' && e.ctrlKey) {
                zoomIn();
                e.preventDefault();
            }
            if (e.key === '-' && e.ctrlKey) {
                zoomOut();
                e.preventDefault();
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
                                全屏模式中 - 按ESC退出 | 鼠标中键/右键平移 | 滚轮缩放
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

            {/* 画布导航控件 */}
            {!readOnly && (
                <div className="canvas-controls" style={{
                    position: 'absolute',
                    right: '20px',
                    bottom: '20px',
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                }}>
                    <button style={getButtonStyle()} onClick={zoomIn}>
                        <i className="fas fa-search-plus"></i>
                    </button>
                    <button style={getButtonStyle()} onClick={zoomOut}>
                        <i className="fas fa-search-minus"></i>
                    </button>
                    <button style={getButtonStyle()} onClick={resetView}>
                        <i className="fas fa-expand"></i>
                    </button>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '6px',
                        borderRadius: '4px',
                        textAlign: 'center',
                        fontSize: '12px',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                    }}>
                        {Math.round(canvasTransform.scale * 100)}%
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
                    overflow: 'hidden',
                    backgroundColor: isFullScreen ? '#1a1a1a' : '#f9f9f9',
                    backgroundImage: isFullScreen
                        ? 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)'
                        : 'linear-gradient(#eee 1px, transparent 1px), linear-gradient(90deg, #eee 1px, transparent 1px)',
                    backgroundSize: `${20 * canvasTransform.scale}px ${20 * canvasTransform.scale}px`,
                    cursor: readOnly ? 'default' : (
                        connectingStart ? 'crosshair' : selectedTool === 'text' ? 'text' : isPanning ? 'grabbing' : 'default'),
                    transition: 'background-color 0.3s',
                    pointerEvents: 'auto'
                }}
                onClick={addNode}
                onWheel={handleWheel}
                onMouseDown={startPanning}
                onMouseMove={(e) => {
                    doPanning(e);
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

                    if (connectingStart && selectedTool === 'arrow') {
                        setConnectingStart(prev => ({ ...prev, currentX: x, currentY: y }));
                        const foundAnchor = findAnchorAtPosition(x, y);
                        setHoveredAnchor(foundAnchor);
                    }
                }}
                onMouseUp={(e) => {
                    stopPanning();
                    setDraggingNodeId(null);
                    if (connectingStart) {
                        endConnection(e);
                    }
                }}
                onMouseLeave={stopPanning}
                onContextMenu={(e) => e.preventDefault()}
            >

                {/* 画布内容容器 (应用变换) */}
                <div style={{
                    transform: `translate(${canvasTransform.translateX}px, ${canvasTransform.translateY}px) scale(${canvasTransform.scale})`,
                    transformOrigin: '0 0',
                    width: '100%',
                    height: '100%',
                    position: 'relative'
                }}>
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
                    {(showSelectionHint && (selectedNodeId || selectedConnectionId)) && (
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
                                                if (selectedTool === 'arrow') {
                                                    startConnection(node.id, position);
                                                }
                                            }}
                                            onMouseEnter={() => {
                                                if (selectedTool === 'arrow' && connectingStart) {
                                                    setHoveredAnchor({ nodeId: node.id, position });
                                                }
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

                        // 获取原始锚点位置
                        const fromAnchor = getAnchorPosition(fromNode, conn.from.anchorPosition);
                        const toAnchor = getAnchorPosition(toNode, conn.to.anchorPosition);

                        // 计算路径
                        const path = calculatePath(
                            fromAnchor,
                            toAnchor,
                            nodes,
                            [conn.from.nodeId, conn.to.nodeId]
                        );
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
                                <path
                                    d={`M ${path.points[0].x} ${path.points[0].y} 
            ${path.points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')}`}
                                    stroke={selectedConnectionId === conn.id ? "#e74c3c" :
                                        (hoveredAnchor?.nodeId === conn.to.nodeId &&
                                            hoveredAnchor?.position === conn.to.anchorPosition) ? "#ff6b6b" :
                                            (isFullScreen ? "#fff" : "#333")}
                                    strokeWidth={selectedConnectionId === conn.id ? "4" : "2"}
                                    fill="none"
                                    markerEnd="url(#arrowhead)"
                                    onClick={(e) => {
                                        if (readOnly) return;
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
                                x2={(connectingStart.currentX - canvasTransform.translateX) / canvasTransform.scale}
                                y2={(connectingStart.currentY - canvasTransform.translateY) / canvasTransform.scale}
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
                                使用鼠标中键/右键平移画布，滚轮缩放画布。<br />
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
            </div>
            {/* 页脚信息 */}
            {
                !isFullScreen && !readOnly && (
                    <div className='footer'>
                        <div>
                            提示：选中节点或连线后按Delete键可删除 | Ctrl+Z撤销删除操作 | Esc取消选择 | F11全屏 | 鼠标中键/右键平移 | 滚轮缩放 | Ctrl+0重置视图 | Ctrl+/-缩放
                        </div>
                        <div className='footer-copyright'>
                            决策流程图工具 v1.5 &copy; {new Date().getFullYear()}
                        </div>
                    </div>
                )
            }

            {/* Font Awesome 图标 */}
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" />


        </div >
    );
});

export default DecisionFlowTool;