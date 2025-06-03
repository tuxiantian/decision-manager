import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import api from './api.js'
import DecisionFlowTool from './DecisionFlowTool'; // 引入新的流程图组件
import html2canvas from 'html2canvas'; // 用于将流程图转换为图片

const FlowchartDetail = () => {
  const { checklistId } = useParams(); // 获取 checklistId 参数
  const [checklist, setChecklist] = useState(null);
  const [flowData, setFlowData] = useState({ nodes: [], connections: [] });
  const flowchartRef = useRef(null); // 用于获取流程图DOM元素
  const flowchartToolRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);

  // 计算并居中所有节点的视图
  const centerView = useCallback(() => {
    if (!flowchartToolRef.current || flowData.nodes.length === 0) return;

    setIsLoading(false);

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

    // 延迟标记为就绪，确保DOM更新完成
    setTimeout(() => {
      setIsLoading(false);
      setIsReady(true);
    }, 300);
  }, [flowData]);

  useEffect(() => {
    // 获取清单详情，包括流程图代码
    const fetchChecklist = async () => {
      try {
        const response = await api.get(`${API_BASE_URL}/platform_checklists/${checklistId}`);
        setChecklist(response.data);
        // 尝试解析存储的流程图数据
        if (response.data.mermaid_code) {
          try {
            const parsedData = JSON.parse(response.data.mermaid_code);
            setFlowData(parsedData);
          } catch (e) {
            console.error('Failed to parse flow data', e);
          }
        }
      } catch (error) {
        console.error('Error fetching checklist:', error);
      }
    };

    fetchChecklist();
  }, [checklistId]);

  // 数据加载完成后自动居中视图
  useEffect(() => {
    if (flowData.nodes.length > 0) {
      centerView();
    }
  }, [flowData, centerView]);

  const handleDownload = async () => {
    console.log(1);
    if (!isReady || !flowchartRef.current) {
      alert("请等待流程图加载完成");
      return;
    }

    try {
      // 获取画布的实际尺寸
      const canvasContainer = flowchartRef.current.querySelector('.decision-flow-container');
      const { scrollWidth, scrollHeight } = canvasContainer;

      // 临时调整容器大小以包含整个画布
      const originalOverflow = flowchartRef.current.style.overflow;
      flowchartRef.current.style.overflow = 'visible';

      // 截图整个画布内容
      const canvas = await html2canvas(canvasContainer, {
        scale: 2,
        width: scrollWidth,
        height: scrollHeight,
        backgroundColor: null,
        useCORS: true,
        logging: false,
        scrollX: -window.scrollX,
        scrollY: -window.scrollY
      });

      // 恢复容器样式
      flowchartRef.current.style.overflow = originalOverflow;

      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `${checklist.name.replace(/\s+/g, '_')}_flowchart.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('生成流程图图片出错:', error);
      alert('导出失败，请重试');
    }
  };

  if (!checklist) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>加载流程图中...</div>;
  }

  return (
    <div className="flowchart-detail" style={{ width: '90%', margin: '0 auto', paddingTop: '20px' }}>
      <h2>{checklist.name} - 流程图</h2>

      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '15px' }}>
        <button onClick={handleDownload}
          disabled={!isReady}
          style={{
            padding: '10px 15px',
            background: isReady ? '#28a745' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isReady ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
          导出为PNG
        </button>
        <button
          onClick={centerView}
          style={{
            padding: '10px 15px',
            background: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          重置视图
        </button>

        <Link
          to="/checklists"
          style={{
            padding: '10px 15px',
            textDecoration: 'none',
            color: 'white',
            background: '#007bff',
            borderRadius: '5px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          返回列表
        </Link>
      </div>

      {isLoading && (
        <div style={{ textAlign: 'center', padding: '10px', color: '#6c757d' }}>
          正在调整视图以显示完整流程图...
        </div>
      )}

      <div
        ref={flowchartRef}
        style={{
          height: '700px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          position: 'relative'
        }}
      >
        <DecisionFlowTool
          ref={flowchartToolRef}
          initialNodes={flowData.nodes}
          initialConnections={flowData.connections}
          readOnly={true} // 设置为只读模式
        />
      </div>

      <div style={{
        margin: '20px auto',
        padding: '15px',
        backgroundColor: '#e9f7ef',
        borderRadius: '8px',
        borderLeft: '4px solid #28a745'
      }}>
        <h3 style={{ marginTop: 0, color: '#218838' }}>关于此流程图</h3>
        <p style={{ marginBottom: '10px' }}>
          此流程图展示了检查单中定义的决策过程。
          每个节点代表流程中的一个步骤，连接线显示步骤之间的流向。
        </p>
        <p>
          <strong>描述：</strong> {checklist.description || '未提供描述。'}
        </p>
      </div>

    </div>
  );
};

export default FlowchartDetail;