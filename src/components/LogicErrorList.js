import React, { useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import api from './api.js'
import LogicErrorEdit from './LogicErrorEdit';

const LogicErrorList = () => {
    const [errors, setErrors] = useState([]);
    const [selectedError, setSelectedError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [mode, setMode] = useState(''); // 'edit' 或 'add'
    const pageSize = 10;

    // 获取所有逻辑错误
    const fetchLogicErrors = async (page) => {
        const response = await api.get('/api/logic_errors_page', {
            params: {
                page: page,
                page_size: pageSize,
                search: searchTerm
            }
        });
        setErrors(response.data.data);
        setTotalPages(response.data.total_pages);
    };

    // 打开新增逻辑错误的表单
    const handleAddError = () => {
        setSelectedError(null);
        setMode('add'); // 设置为新增模式
    };

    // 打开编辑窗口
    const handleEdit = (error) => {
        console.log("Editing error:", error);  // 调试日志
        setSelectedError(error);
        setMode('edit');
    };

    // 添加键盘事件的处理函数，回车键触发搜索
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearchButton();
        }
    };

    const handleSearchButton = () => {
        setCurrentPage(1);
        fetchLogicErrors(1);
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value.toLowerCase());
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        setCurrentPage(1);
        fetchLogicErrors(1);
    };

    const closeModal = () => {
        setSelectedError(null);
        setMode('');
    };

    // 更新逻辑错误列表
    const handleUpdate = async (updatedError) => {
        await fetchLogicErrors();
        setSelectedError(null);
        setMode('');
    };

    useEffect(() => {
        fetchLogicErrors(currentPage);
    }, [currentPage]);

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
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
            <h2>逻辑错误列表</h2>
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <input
                        type="text"
                        placeholder="Search by name, term"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        onKeyDown={handleKeyDown}  // 监听键盘事件
                        style={{ width: '90%', padding: '10px', paddingRight: '40px' }}
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
                <button onClick={handleSearchButton} style={{ padding: '10px' }} className='green-button'>Search</button>
                <button onClick={handleAddError} style={{ marginLeft: '10px', padding: '10px' }} className="green-button">新增逻辑谬误</button>
            </div>


            <ul style={{ padding: '0', listStyleType: 'none' }}>
                {errors.map((error) => (
                    <li key={error.id} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 0',
                        borderBottom: '1px solid #ddd'
                    }}>
                        <p style={{ margin: 0, flex: 1 }}><strong>{error.name}</strong></p>
                        <p style={{ margin: 0, flex: 1 }}>{error.term}</p>
                        <button onClick={() => handleEdit(error)} style={{ marginLeft: 'auto' }} className='green-button'>编辑</button>
                    </li>
                ))}
            </ul>

            <div style={{ display: 'flex', justifyContent: 'space-around', margin: '20px auto' }}>
                <button onClick={handlePrevPage} disabled={currentPage === 1} className='green-button'>Previous</button>
                <p style={{ margin: '0 10px', display: 'flex', alignItems: 'center' }}>Page {currentPage} of {totalPages}</p>
                <button onClick={handleNextPage} disabled={currentPage >= totalPages} className='green-button'>Next</button>
            </div>

            {(selectedError || mode == 'add') && (
                <LogicErrorEdit
                    mode={mode}
                    error={selectedError}
                    onClose={closeModal}
                    onUpdate={handleUpdate}
                />
            )}
        </div>
    );
};

export default LogicErrorList;
