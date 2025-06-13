import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import api from './api.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

const ChecklistList = () => {
  const [checklists, setChecklists] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 5;
  const navigate = useNavigate();

  const fetchChecklists = async (page) => {
    const response = await api.get(`${API_BASE_URL}/platform_checklists`, {
      params: {
        page: page,
        page_size: pageSize
      }
    });

    if (response.data) {
      const { checklists, total_pages } = response.data;
      setChecklists(checklists);
      setTotalPages(total_pages);
    }
  }

  useEffect(() => {
    fetchChecklists(currentPage);
  }, [currentPage]);

  const handleUpdateClick = (checklistId) => {
    navigate(`/checklist/update/${checklistId}`);
  };

  const handleViewFlowchartClick = (checklistId) => {
    navigate(`/checklist/flowchart/${checklistId}`);
  };

  // 删除 Checklist 的函数
  const handleDeleteChecklist = async (checklistId, isParent) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this checklist?");
    if (!confirmDelete) return;

    try {
      const url = isParent
        ? `${API_BASE_URL}/platform_checklists/${checklistId}/delete-with-children`
        : `${API_BASE_URL}/platform_checklists/${checklistId}`;
      await api.delete(url);

      // 删除后刷新列表
      fetchChecklists(currentPage);
    } catch (error) {
      console.error('Error deleting checklist:', error);
      alert('Failed to delete the checklist.');
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prevPage => prevPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prevPage => prevPage - 1);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <ul style={{ listStyle: 'none', padding: 0, width: '80%' }}>
        {checklists.map(checklist => (
          <li key={checklist.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #ccc' }}>
            <div style={{ textAlign: 'left', maxWidth: '600px' }}>
              <strong>{checklist.name}</strong> - Version: {checklist.version} - Clone Count:{checklist.clone_count}
              <div>{checklist.description}</div>
              {checklist.versions && checklist.versions.length > 0 && (
                <ul style={{ marginLeft: '20px', listStyle: 'circle' }}>
                  {checklist.versions.map(version => (
                    <li key={version.id} style={{ marginBottom: '5px' }}>
                      <strong>{version.name}</strong> - Version: {version.version} - Clone Count:{version.clone_count}
                      <button
                        onClick={() => handleDeleteChecklist(version.id, false)}
                        style={{ marginLeft: '10px', background: 'none', border: 'none', padding: '5px', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        <FontAwesomeIcon icon={faTrash} style={{ color: '#ff4444', fontSize: '1.2rem' }} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {checklist.can_update && (
                <button onClick={() => handleUpdateClick(checklist.id)} className='green-button'>Update Version</button>
              )}
              <button onClick={() => handleViewFlowchartClick(checklist.id)} className='green-button'>View Flowchart</button>
              <button
                onClick={() => handleDeleteChecklist(checklist.id, true)}
                style={{ background: 'none', border: 'none', padding: '5px', borderRadius: '4px', cursor: 'pointer' }}
              >
                <FontAwesomeIcon icon={faTrash} style={{ color: '#ff4444', fontSize: '1.2rem' }} />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '20px auto' }}>
        <button onClick={handlePrevPage} disabled={currentPage === 1} className='green-button'>Previous</button>
        <p style={{ margin: '0 10px', display: 'flex', alignItems: 'center' }}>Page {currentPage} of {totalPages}</p>
        <button onClick={handleNextPage} disabled={currentPage >= totalPages} className='green-button'>Next</button>
      </div>
    </div>
  );
};

export default ChecklistList;