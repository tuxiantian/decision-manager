import React, { useState } from 'react';
import api from './api.js'

const LogicErrorEdit = ({ error, onClose, onUpdate }) => {
    const [formData, setFormData] = useState({
        name: error.name,
        term: error.term,
        description: error.description,
        example: error.example,
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await api.put(`/api/logic_errors/${error.id}`, formData);
        onUpdate(formData);
        onClose(); // 关闭弹窗
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <h3>编辑逻辑错误</h3>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ marginRight: '10px' }}>名称：</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} style={{ flex: 1 }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ marginRight: '10px' }}>术语：</label>
                        <input type="text" name="term" value={formData.term} onChange={handleChange} style={{ flex: 1 }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ marginRight: '10px' }}>描述：</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} style={{ flex: 1 ,height:'100px'}} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ marginRight: '10px' }}>示例：</label>
                        <textarea name="example" value={formData.example} onChange={handleChange} style={{ flex: 1 ,height:'100px'}} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                        <button type="submit" className='green-button'>保存更改</button>
                        <button type="button" className='gray-button' onClick={onClose}>取消</button>
                    </div>

                </form>
            </div>
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
export default LogicErrorEdit;
