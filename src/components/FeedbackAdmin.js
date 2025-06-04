import React, { useEffect, useState } from 'react';
import api from './api.js'

const FeedbackAdmin = () => {
    const [feedbackList, setFeedbackList] = useState([]);
    const [response, setResponse] = useState('');
    const [selectedFeedback, setSelectedFeedback] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 10;
    const fetchFeedback = async (page) => {
        const response = await api.get('/api/admin/feedback', {
            params: {
                page: page,
                page_size: pageSize
            }
        });
        setFeedbackList(response.data.data);
        setTotalPages(response.data.total_pages);
    };

    useEffect(() => {

        fetchFeedback(currentPage);
    }, [currentPage]);

    const handleResponseSubmit = async (e) => {
        e.preventDefault();
        await api.post(`/api/admin/feedback/${selectedFeedback.id}/respond`, { 'response': response });
        fetchFeedback(currentPage);
        setSelectedFeedback(null);
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

    // 获取文件名的函数
    const getFileNameFromUrl = (url) => {
        try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/');
            return decodeURIComponent(pathParts[pathParts.length - 1]);
        } catch {
            return '附件';
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
            {/* 添加标题行 */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 0',
                fontWeight: 'bold',
                borderBottom: '2px solid #000' // 为标题行添加下划线
            }}>
                <p style={{ flex: 1 }}>用户ID</p>
                <p style={{ flex: 4 }}>反馈内容</p>
                <p style={{ flex: 2 }}>附件</p>
                <p style={{ flex: 1 }}>联系方式</p>
                <p style={{ flex: 1 }}>状态</p>
                <p style={{ flex: 1 }}>操作</p>
            </div>
            <ul style={{ padding: '0', listStyleType: 'none' }}>
                {feedbackList.map(fb => (
                    <li key={fb.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 0',
                        borderBottom: '1px solid #ddd'
                    }}>
                        <p style={{ flex: 1 }}>{fb.user_id}</p>
                        <p style={{ flex: 4 }}>{fb.description}</p>
                        {/* 附件列 */}
                        <div style={{ flex: 2 }}>
                            {fb.attachments && fb.attachments.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    {fb.attachments.map((url, index) => (
                                        <a
                                            key={index}
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                padding: '3px 8px',
                                                backgroundColor: '#e9ecef',
                                                borderRadius: '4px',
                                                color: '#007bff',
                                                textDecoration: 'none',
                                                fontSize: '0.9em',
                                                display: 'inline-block',
                                                maxWidth: '200px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}
                                            download
                                        >
                                            {getFileNameFromUrl(url)}
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <span style={{ color: '#999' }}>无附件</span>
                            )}
                        </div>
                        <p style={{ flex: 1 }}>{fb.contact_info}</p>
                        <p style={{ flex: 1 }}>{fb.status}</p>
                        <div style={{ flex: 1 }}>
                            {fb.status === "未回复" ? (
                                <button onClick={() => setSelectedFeedback(fb)} className='green-button'>回复</button>
                            ) : (
                                <p>{fb.response}</p>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '20px' }}>
                <button onClick={handlePrevPage} disabled={currentPage === 1} style={{
                    padding: '5px 15px',
                    backgroundColor: currentPage === 1 ? '#6c757d' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                }}>Previous</button>
                <p>Page {currentPage} of {totalPages}</p>
                <button onClick={handleNextPage} disabled={currentPage >= totalPages} style={{
                    padding: '5px 15px',
                    backgroundColor: currentPage >= totalPages ? '#6c757d' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer'
                }}>Next</button>
            </div>
            {selectedFeedback && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>

                        <h3>回复反馈</h3>
                        <form onSubmit={handleResponseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <p>反馈内容: {selectedFeedback.description}</p>
                            {/* 在模态框中显示附件 */}
                            {selectedFeedback.attachments && selectedFeedback.attachments.length > 0 && (
                                <div>
                                    <p><strong>附件:</strong></p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
                                        {selectedFeedback.attachments.map((url, index) => (
                                            <a
                                                key={index}
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    padding: '3px 8px',
                                                    backgroundColor: '#e9ecef',
                                                    borderRadius: '4px',
                                                    color: '#007bff',
                                                    textDecoration: 'none',
                                                    fontSize: '0.9em'
                                                }}
                                                download
                                            >
                                                {getFileNameFromUrl(url)}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <textarea
                                style={{
                                    height: '100px',
                                    padding: '10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px'
                                }}
                                value={response}
                                onChange={(e) => setResponse(e.target.value)}
                                placeholder="请输入回复内容..."
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                                <button className='green-button'>提交回复</button>
                                <button onClick={() => setSelectedFeedback(null)} className='gray-button'>取消</button>

                            </div>


                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // 半透明背景
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
    },
    modal: {
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        width: '600px',
        maxWidth: '80%',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
    }
};
export default FeedbackAdmin;
