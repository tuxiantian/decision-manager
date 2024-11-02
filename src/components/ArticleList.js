import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';  // 需要安装 react-icons 包
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import api from './api.js'
import '../App.css'

const ArticleList = () => {
    const [articles, setArticles] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedTag, setSelectedTag] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedArticle, setSelectedArticle] = useState(null);
    const pageSize = 10;

    const navigate = useNavigate();

    useEffect(() => {
        fetchArticles(currentPage);
    }, [currentPage]);

    const fetchArticles = (page) => {
        api.get(`${API_BASE_URL}/articles`, {
            params: {
                page: page,
                page_size: pageSize,
                search: searchTerm,
                tag: selectedTag,
            },
        })
            .then(response => {
                if (response.data) {
                    const { articles, total_pages } = response.data;
                    setArticles(articles);
                    setTotalPages(total_pages);
                }
            })
            .catch(error => {
                console.error('There was an error fetching the articles!', error);
            });
    };

    const handleDelete = (id) => {
        api.delete(`${API_BASE_URL}/articles/${id}`)
            .then(() => {
                const updatedArticles = articles.filter(article => article.id !== id);
                setArticles(updatedArticles);
                closeConfirmModal();
            })
            .catch(error => {
                console.error('There was an error deleting the article!', error);
            });
    };

    const handleEdit = (id) => {
        navigate(`/edit-article/${id}`);
    };

    const handleAdd = () => {
        navigate('/add-article');
    };

    const handleView = (id) => {
        navigate(`/view-article/${id}`);
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value.toLowerCase());
    };

    const handleSearchButton = () => {
        setCurrentPage(1);
        fetchArticles(1);
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        setCurrentPage(1);
        fetchArticles(1);
    };

    // 添加键盘事件的处理函数，回车键触发搜索
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearchButton();
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

    // 打开确认删除模态框
    const openConfirmModal = (article) => {
        setSelectedArticle(article);
        setIsModalOpen(true);
    };

    const closeConfirmModal = () => {
        setIsModalOpen(false);
        setSelectedArticle(null);
    };

    const Modal = ({ isOpen, onClose, onConfirm, title }) => {
        const [inputValue, setInputValue] = useState("");

        const handleConfirm = () => {
            if (inputValue === title) {
                onConfirm && onConfirm();  // 确保 onConfirm 存在并调用
            } else {
                alert("The entered title does not match.");
            }
        };

        if (!isOpen) return null;

        return (
            <div className="modal-overlay">
                <div className="modal-content">
                    <h3>Confirm Deletion</h3>
                    <p>To confirm deletion, please enter the title: </p>
                    <div><strong>{title}</strong></div>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Enter title"
                    />
                    <div className="modal-buttons">
                        <button onClick={handleConfirm} className="confirm-button">Confirm</button>
                        <button onClick={onClose} className="cancel-button">Cancel</button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h2>Articles List</h2>
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <input
                        type="text"
                        placeholder="Search by title, tags, or keywords"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        onKeyDown={handleKeyDown}  // 监听键盘事件
                        style={{ width: '100%', padding: '10px', paddingRight: '40px' }}
                    />
                    {searchTerm && (
                        <FaTimes
                            onClick={handleClearSearch}
                            style={{
                                position: 'absolute',
                                right: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                cursor: 'pointer',
                                color: '#999'
                            }}
                        />
                    )}
                </div>
                <select value={selectedTag} onChange={(e) => setSelectedTag(e.target.value)} style={{ padding: '10px' }}>
                    <option value="">Select Tag</option>
                    <option value="ThinkingModel">Thinking Model</option>
                    <option value="CognitiveBias">Cognitive Bias</option>
                </select>
                <button onClick={handleSearchButton} style={{ padding: '10px' }} className='green-button'>Search</button>
                <button onClick={handleAdd} style={{ marginLeft: '10px', padding: '10px' }} className='green-button'>Add New Article</button>
            </div>
            <ul style={{ listStyleType: 'none', padding: 0 }}>
                {articles.map(article => (
                    <li key={article.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: '1px solid #ccc',
                        padding: '10px',
                        marginBottom: '10px'
                    }}>
                        <div style={{ flex: 3 }}>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: '20px',
                                marginBottom: '5px'
                            }}>
                                <h3 style={{ margin: 0 }}>{article.title}</h3>
                                <p style={{ margin: 0 }}>Author: {article.author}</p>
                            </div>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: '20px'
                            }}>
                                <p style={{ margin: 0 }}>Reference Count: {article.reference_count}</p>
                                <p style={{ margin: 0 }}>Tags: {article.tags}</p>
                                <p style={{ margin: 0 }}>Updated At: {new Date(article.updated_at).toLocaleString()}</p>
                            </div>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: '20px'
                            }}>
                                <p style={{ margin: 0 }}>Keywords: {article.keywords}</p>
                            </div>
                        </div>
                        <div style={{ flex: 1, textAlign: 'right' }}>
                            <button onClick={() => handleView(article.id)} style={{ marginRight: '10px' }} className='green-button'>View</button>
                            <button onClick={() => handleEdit(article.id)} style={{ marginRight: '10px' }} className='green-button'>Edit</button>
                            <button onClick={() => openConfirmModal(article)} className='red-button'>Delete</button>
                        </div>
                    </li>
                ))}
            </ul>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                <button onClick={handlePrevPage} disabled={currentPage === 1} className='green-button'>Previous</button>
                <p>Page {currentPage} of {totalPages}</p>
                <button onClick={handleNextPage} disabled={currentPage >= totalPages} className='green-button'>Next</button>
            </div>
            {/* 模态框 */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeConfirmModal}
                onConfirm={selectedArticle ? () => handleDelete(selectedArticle.id) : () => { }}  // 始终传递有效函数
                title={selectedArticle ? selectedArticle.title : ""}
            />
        </div>
    );
};

export default ArticleList;
