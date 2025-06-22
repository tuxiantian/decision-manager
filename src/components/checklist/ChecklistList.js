import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config.js';
import api from '../api.js'
import './ChecklistList.css';
import { Modal, Button, Form } from 'react-bootstrap';
import '//at.alicdn.com/t/c/font_4955755_8r0qvum3c9b.js';

const ChecklistList = () => {
  const [tab, setTab] = useState('platform');
  const [userChecklists, setUserChecklists] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 5;
  const navigate = useNavigate();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentChecklist, setCurrentChecklist] = useState(null);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewAction, setReviewAction] = useState('approve');

  const fetchUserChecklists = async (page) => {
    const response = await api.get(`/checklists`, {
      params: {
        page: page,
        page_size: pageSize
      }
    });

    if (response.data) {
      const { checklists, total_pages } = response.data;
      setUserChecklists(checklists);
      setTotalPages(total_pages);
    }
  }

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

  const handleReviewSubmit = async () => {
    try {
      await api.post(`${API_BASE_URL}/checklists/review`, {
        checklist_id: currentChecklist.id,
        action: reviewAction,
        comment: reviewComment
      });
      alert(`Checklist ${reviewAction === 'approve' ? 'approved' : 'rejected'} successfully!`);
      setShowReviewModal(false);
      fetchUserChecklists(currentPage); // Refresh the list
    } catch (error) {
      console.error('Error reviewing checklist:', error);
      alert(error.response?.data?.error || 'Failed to review checklist');
    }
  };

  // Function to open review modal
  const handleReviewClick = (checklist) => {
    setCurrentChecklist(checklist);
    setReviewComment('');
    setReviewAction('approve');
    setShowReviewModal(true);
  };

  const handleUpdateClick = (checklistId) => {
    navigate(`/checklist/update/${checklistId}`);
  };
  const handleEditClick = (checklistId) => {
    navigate(`/checklist/edit/${checklistId}`);
  };
  const handleViewFlowchartClick = (checklistId, isPlatform) => {
    navigate(`/checklist/flowchart/${checklistId}`, { state: { isPlatform } });
  };

  const handleViewClick = (checklistId, isPlatform) => {
    navigate(`/checklist-view/${checklistId}`, { state: { isPlatform } });
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

  useEffect(() => {
    if (tab === 'user') {
      fetchUserChecklists(currentPage);
    } else if (tab === 'platform') {
      fetchChecklists(currentPage);
    }
  }, [tab, currentPage]);

  const handleTabChange = (newTab) => {
    setTab(newTab);
    setCurrentPage(1); // 切换标签时重置页码
  };

  // 渲染用户检查清单项（简单列表）
  const renderUserChecklistItem = (checklist) => (
    <li key={checklist.id} className="checklist-item">
      <div className="checklist-info">
        <strong>{checklist.name}</strong>
        <div>{checklist.description}</div>
        <div>Version: {checklist.version}</div>
      </div>
      <div className="checklist-actions">
        <button onClick={() => handleViewClick(checklist.id, false)} className='icon-button'>
          <div className="icon-tooltip">
            <svg className="icon" aria-hidden="true">
              <use xlinkHref="#icon-chakan"></use>
            </svg>
            <span className="tooltip-text">查看</span>
          </div>
        </button>
        <button onClick={() => handleReviewClick(checklist)} className="icon-button">
          <div className="icon-tooltip">
            <svg className="icon" aria-hidden="true">
              <use xlinkHref="#icon-shenhe"></use>
            </svg>
            <span className="tooltip-text">审核</span>
          </div>
        </button>
        <button onClick={() => handleViewFlowchartClick(checklist.id, false)} className="icon-button">
          <div className="icon-tooltip">
            <svg className="icon" aria-hidden="true">
              <use xlinkHref="#icon-liuchengtu"></use>
            </svg>
            <span className="tooltip-text">流程图</span>
          </div>
        </button>
      </div>
    </li>
  );

  // 渲染平台检查清单项（包含版本树）
  const renderPlatformChecklistItem = (checklist) => (
    <li key={checklist.id} className="checklist-item">
      <div className="checklist-info">
        <strong>{checklist.name}</strong>
        <div>{checklist.description}</div>
        <div>Version: {checklist.version} | Clone Count: {checklist.clone_count}</div>

        {checklist.versions && checklist.versions.length > 0 && (
          <ul className="version-list">
            {checklist.versions.map(version => (
              <li key={version.id} className="version-item">
                <div>
                  <strong>{version.name}</strong>
                  <div>Version: {version.version} | Clone Count: {version.clone_count}</div>
                </div>
                <div className="version-actions">
                  <button onClick={() => handleViewClick(version.id, true)} className='icon-button'>
                    <div className="icon-tooltip">
                      <svg className="icon" aria-hidden="true">
                        <use xlinkHref="#icon-chakan"></use>
                      </svg>
                      <span className="tooltip-text">查看</span>
                    </div>
                  </button>
                  <button onClick={() => handleDeleteChecklist(version.id, false)} className="icon-button">
                    <div className="icon-tooltip">
                      <svg className="icon" aria-hidden="true">
                        <use xlinkHref="#icon-shanchu"></use>
                      </svg>
                      <span className="tooltip-text">删除</span>
                    </div>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="checklist-actions">
        {checklist.can_update && (
          <button onClick={() => handleUpdateClick(checklist.id)} className="icon-button">
            <div className="icon-tooltip">
              <svg className="icon" aria-hidden="true">
                <use xlinkHref="#icon-gengxinbanben"></use>
              </svg>
              <span className="tooltip-text">更新版本</span>
            </div>
          </button>
        )}
        <button onClick={() => handleViewClick(checklist.id, true)} className='icon-button'>
          <div className="icon-tooltip">
            <svg className="icon" aria-hidden="true">
              <use xlinkHref="#icon-chakan"></use>
            </svg>
            <span className="tooltip-text">查看</span>
          </div>
        </button>
        <button onClick={() => handleEditClick(checklist.id)} className="icon-button">
          <div className="icon-tooltip">
            <svg className="icon" aria-hidden="true">
              <use xlinkHref="#icon-bianji"></use>
            </svg>
            <span className="tooltip-text">编辑</span>
          </div>
        </button>
        <button onClick={() => handleViewFlowchartClick(checklist.id, true)} className="icon-button">
          <div className="icon-tooltip">
            <svg className="icon" aria-hidden="true">
              <use xlinkHref="#icon-liuchengtu"></use>
            </svg>
            <span className="tooltip-text">流程图</span>
          </div>
        </button>
        <button onClick={() => handleDeleteChecklist(checklist.id, true)} className="icon-button">
          <div className="icon-tooltip">
            <svg className="icon" aria-hidden="true">
              <use xlinkHref="#icon-shanchu"></use>
            </svg>
            <span className="tooltip-text">删除</span>
          </div>
        </button>
      </div>
    </li>
  );

  return (
    <div className="checklist-container">
      {/* Tab Navigation */}
      <div className="tab-container">
        <button
          className={`tab-button ${tab === 'user' ? 'active' : ''}`}
          onClick={() => handleTabChange('user')}
        >
          User Checklists
        </button>
        <button
          className={`tab-button ${tab === 'platform' ? 'active' : ''}`}
          onClick={() => handleTabChange('platform')}
        >
          Platform & User Share
        </button>
      </div>

      {/* 清单列表 */}
      <ul className="checklist-list">
        {tab === 'user'
          ? userChecklists.map(renderUserChecklistItem)
          : checklists.map(renderPlatformChecklistItem)}
      </ul>

      {/* Review Modal */}
      <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Review Checklist</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="reviewAction">
              <Form.Label>Action</Form.Label>
              <Form.Control
                as="select"
                value={reviewAction}
                onChange={(e) => setReviewAction(e.target.value)}
              >
                <option value="approve">Approve</option>
                <option value="reject">Reject</option>
              </Form.Control>
            </Form.Group>
            <Form.Group controlId="reviewComment" className="mt-3">
              <Form.Label>Comment</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Enter your review comments..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReviewModal(false)}>
            Cancel
          </Button>
          <Button
            variant={reviewAction === 'approve' ? 'success' : 'danger'}
            onClick={handleReviewSubmit}
          >
            {reviewAction === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </Modal.Footer>
      </Modal>

      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '20px auto' }}>
        <button onClick={handlePrevPage} disabled={currentPage === 1} className='green-button'>Previous</button>
        <p style={{ margin: '0 10px', display: 'flex', alignItems: 'center' }}>Page {currentPage} of {totalPages}</p>
        <button onClick={handleNextPage} disabled={currentPage >= totalPages} className='green-button'>Next</button>
      </div>
    </div>
  );
};

export default ChecklistList;