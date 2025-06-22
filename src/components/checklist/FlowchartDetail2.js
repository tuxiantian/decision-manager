import React, { useEffect, useState } from 'react';
import mermaid from 'mermaid';
import { useParams, Link } from 'react-router-dom';
import { API_BASE_URL } from '../config.js';
import api from './api.js'

const FlowchartDetail = () => {
  const { checklistId } = useParams(); // 获取 checklistId 参数
  const [checklist, setChecklist] = useState(null);

  useEffect(() => {
    // 获取清单详情，包括流程图代码
    const fetchChecklist = async () => {
      try {
        const response = await api.get(`${API_BASE_URL}/platform_checklists/${checklistId}`);
        setChecklist(response.data);
      } catch (error) {
        console.error('Error fetching checklist:', error);
      }
    };

    fetchChecklist();
  }, [checklistId]);

  useEffect(() => {
    // 在页面元素加载后延迟执行 mermaid 的渲染
    if (checklist && checklist.mermaid_code) {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        themeCSS: `
        .nodeLabel  p {
          white-space: pre-wrap;         /* 强制长文本换行 */
        }
        `,
        flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'linear' },
        securityLevel: 'loose',
      });

      try {
        // 确保 DOM 元素加载完成后，调用 mermaid 的渲染函数
        mermaid.run();

      } catch (e) {
        console.error('Mermaid rendering error:', e);
      }
    }
  }, [checklist]);

  if (!checklist) {
    return <div>Loading flowchart...</div>;
  }

  const handleDownload = async () => {
    try {
      const response = await api.post(`${API_BASE_URL}/generate-mermaid`, {
        mermaid_code: checklist.mermaid_code
      }, {
        responseType: 'blob'
      });

      // Create a link to download the generated PNG
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'mermaid-diagram.png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating Mermaid diagram:', error);
    }
  };

  return (
    <div className="flowchart-detail" style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '20px' }}>
      <h2>{checklist.name} - Flowchart</h2>
      {checklist.mermaid_code && (
        <div
          id="mermaid-flowchart"
          className="mermaid"
          style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '5px', marginTop: '20px' }}
        >
          {checklist.mermaid_code}
        </div>
      )}

      <div style={{ display: 'flex', gap: '20px', marginTop: '20px', justifyContent: 'center' }}>
        <button onClick={handleDownload} style={{ padding: '10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Download Flowchart as PNG
        </button>
        <Link
          to="/checklists"
          style={{ padding: '10px 20px', textDecoration: 'none', color: 'white', background: '#007bff', borderRadius: '5px' }}
        >
          Back to Checklist List
        </Link>
      </div>
    </div>
  );
};

export default FlowchartDetail;