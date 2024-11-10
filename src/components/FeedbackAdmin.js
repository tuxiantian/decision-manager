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

    const handleResponseSubmit = async (id) => {
        await api.post(`/api/admin/feedback/${id}/respond`, { response });
        setFeedbackList(feedbackList.map(fb => fb.id === id ? { ...fb, response, status: "已回复" } : fb));
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

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
            <h2>用户反馈管理</h2>
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
                <button onClick={handlePrevPage} disabled={currentPage === 1} className='green-button'>Previous</button>
                <p>Page {currentPage} of {totalPages}</p>
                <button onClick={handleNextPage} disabled={currentPage >= totalPages} className='green-button'>Next</button>
            </div>
            {selectedFeedback && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>

                        <h3>回复反馈</h3>
                        <form style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <p>反馈内容: {selectedFeedback.description}</p>
                            <textarea
                                style={{ height: '100px' }}
                                value={response}
                                onChange={(e) => setResponse(e.target.value)}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                                <button onClick={() => handleResponseSubmit(selectedFeedback.id)} className='green-button'>提交回复</button>
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
