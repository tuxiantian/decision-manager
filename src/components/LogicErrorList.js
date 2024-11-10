import React, { useEffect, useState } from 'react';
import api from './api.js'
import LogicErrorEdit from './LogicErrorEdit';

const LogicErrorList = () => {
    const [errors, setErrors] = useState([]);
    const [selectedError, setSelectedError] = useState(null);

    // 获取所有逻辑错误
    const fetchLogicErrors = async () => {
        const response = await api.get('/api/logic_errors');
        setErrors(response.data);
    };

    // 打开编辑窗口
    const handleEdit = (error) => {
        console.log("Editing error:", error);  // 调试日志
        setSelectedError(error);
        
    };

    const closeModal = () => {
        setSelectedError(null);
    };

    // 更新逻辑错误列表
    const handleUpdate = async (updatedError) => {
        await fetchLogicErrors();
        setSelectedError(null);
       
    };

    useEffect(() => {
        fetchLogicErrors();
    }, []);

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
            <h2>逻辑错误列表</h2>
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
            {selectedError && (
                <LogicErrorEdit                    
                    error={selectedError}
                    onClose={closeModal}
                    onUpdate={handleUpdate}
                />
            )}
        </div>
    );
};

export default LogicErrorList;
