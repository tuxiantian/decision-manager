import React, { useEffect, useState, useRef } from 'react';
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

  if (!checklist) {
    return <div>Loading flowchart...</div>;
  }

  const handleDownload = async () => {
    if (!flowchartRef.current) return;
    try {
      // 使用html2canvas将流程图转换为图片
      const canvas = await html2canvas(flowchartRef.current, {
        scale: 2, // 提高图片质量
        backgroundColor: '#1e1e1e', // 匹配深色背景
        useCORS: true
      });

      // 创建下载链接
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `${checklist.name.replace(/\s+/g, '_')}_flowchart.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating flowchart image:', error);
      alert('Failed to generate flowchart image. Please try again.');
    }
  };


  return (
    <div className="flowchart-detail" style={{ width: '90%', margin: '0 auto', paddingTop: '20px' }}>
      <h2>{checklist.name} - Flowchart</h2>

      <div style={{ display: 'flex', gap: '15px' }}>
        <button onClick={handleDownload} style={{
          padding: '10px 15px',
          background: '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.2s',
          ':hover': {
            backgroundColor: '#218838',
            transform: 'translateY(-2px)'
          }
        }}>
          Download Flowchart as PNG
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
            gap: '8px',
            transition: 'all 0.2s',
            ':hover': {
              backgroundColor: '#0069d9',
              transform: 'translateY(-2px)'
            }
          }}
        >
          Back to Checklist List
        </Link>
      </div>
      <div
        ref={flowchartRef}
        style={{
          height: '700px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
      >
        <DecisionFlowTool
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