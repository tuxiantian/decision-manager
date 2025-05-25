import { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Table, Tabs, Tab } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './InspirationManagement.css';

import { API_BASE_URL } from '../config';
import api from './api.js'

export default function InspirationManagement() {
    const [inspirations, setInspirations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [currentInspiration, setCurrentInspiration] = useState(null);
    const [formData, setFormData] = useState({
        type: 'text',
        content: ''
    });

    // 获取所有启发内容
    const fetchInspirations = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/admin/inspirations');
            setInspirations(response.data);
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    // 提交表单
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = currentInspiration
                ? `/api/admin/inspirations/${currentInspiration.id}`
                : '/api/admin/inspirations';

            const method = currentInspiration ? 'put' : 'post';

            await api[method](url, formData);

            setShowModal(false);
            fetchInspirations();
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        }
    };

    // 删除启发
    const handleDelete = async (id) => {
        if (!window.confirm('确定要删除这条启发吗？')) return;

        try {
            await api.delete(`/api/admin/inspirations/${id}`);
            fetchInspirations();
        } catch (err) {
            alert(err.response?.data?.error || err.message);
        }
    };

    // 初始化加载
    useEffect(() => {
        fetchInspirations();
    }, []);

    // 处理表单输入
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    // 打开添加模态框
    const handleShowAddModal = () => {
        setCurrentInspiration(null);
        setFormData({
            type: 'text',
            content: ''
        });
        setShowModal(true);
    };

    // 打开编辑模态框
    const handleShowEditModal = (inspiration) => {
        setCurrentInspiration(inspiration);
        setFormData({
            type: inspiration.type,
            content: inspiration.content
        });
        setShowModal(true);
    };

    // 新增状态
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [activeTab, setActiveTab] = useState('url'); // 'url' 或 'upload'

    // 处理文件上传
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setUploadProgress(0);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await api.post('/upload', formData, {
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setUploadProgress(percentCompleted);
                }
            });

            // 更新表单数据
            setFormData({
                ...formData,
                content: response.data.url,
                type:'image'
            });
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setUploading(false);
        }
    };

    // 修改模态框中的图片输入部分
    const renderImageInput = () => (
        <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-3"
        >
            <Tab eventKey="url" title="外部图片URL">
                <Form.Control
                    type="url"
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    required={formData.type === 'image' && activeTab === 'url'}
                    placeholder="https://example.com/image.jpg"
                    className="mb-3"
                />
            </Tab>
            <Tab eventKey="upload" title="上传本地图片">
                <div className="upload-area">
                    {uploading ? (
                        <div className="progress-container">
                            <div className="progress-bar" style={{ width: `${uploadProgress}%` }} />
                            <span>上传中: {uploadProgress}%</span>
                        </div>
                    ) : (
                        <>
                            <Form.Control
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="mb-2"
                            />
                            <small className="text-muted">
                                支持 JPG, PNG, GIF 格式，最大 5MB
                            </small>
                        </>
                    )}
                </div>
            </Tab>
        </Tabs>
    );

    // 修改模态框中的内容部分
    const renderContentInput = () => {
        if (formData.type === 'text') {
            return (
                <Form.Control
                    as="textarea"
                    rows={5}
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    required
                    className="mb-3"
                    placeholder="请输入启发性的文字内容..."
                />
            );
        } else {
            return (
                <>
                    {renderImageInput()}
                    {formData.content && (
                        <div className="image-preview">
                            <div className="text-muted small mb-2">图片预览：</div>
                            <img
                                src={formData.content}
                                alt="预览"
                                className="img-thumbnail"
                                onError={(e) => e.target.src = '/placeholder-image.jpg'}
                            />
                        </div>
                    )}
                </>
            );
        }
    };

    // 修改表单部分
    const renderForm = () => (
        <Form onSubmit={handleSubmit}>
            <Form.Group controlId="formType" className="mb-4">
                <Form.Label>内容类型</Form.Label>
                <Form.Control
                    as="select"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="form-select"
                >
                    <option value="text">文字</option>
                    <option value="image">图片</option>
                </Form.Control>
            </Form.Group>

            <Form.Group controlId="formContent" className="mb-3">
                <Form.Label>
                    {formData.type === 'text' ? '启发文字内容' : '图片'}
                </Form.Label>
                {renderContentInput()}
            </Form.Group>

            <Modal.Footer className="border-0 pt-0">
                <Button
                    variant="outline-secondary"
                    onClick={() => setShowModal(false)}
                    className="me-2"
                >
                    取消
                </Button>
                <Button
                    variant="primary"
                    type="submit"
                    disabled={uploading}
                >
                    {currentInspiration ? '保存更改' : '添加启发'}
                </Button>
            </Modal.Footer>
        </Form>
    );

    if (loading) return <div className="loading">加载中...</div>;
    if (error) return <Alert variant="danger">错误: {error}</Alert>;

    return (
        <div className="inspiration-management">
            <div className="header">
                <h2>启发内容管理</h2>
                <Button variant="primary" onClick={handleShowAddModal}>
                    添加新启发
                </Button>
            </div>

            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th width="10%">类型</th>
                        <th width="60%">内容</th>
                        <th width="20%">创建时间</th>
                        <th width="10%">操作</th>
                    </tr>
                </thead>
                <tbody>
                    {inspirations.map(item => (
                        <tr key={item.id}>
                            <td>{item.type === 'text' ? '文字' : '图片'}</td>
                            <td className="content-cell">
                                {item.type === 'image' ? (
                                    <img src={item.content} alt="启发图片" className="thumbnail" />
                                ) : (
                                    item.content
                                )}
                            </td>
                            <td>{new Date(item.created_at).toLocaleString()}</td>
                            <td>
                                <Button
                                    variant="info"
                                    size="sm"
                                    onClick={() => handleShowEditModal(item)}
                                >
                                    编辑
                                </Button>
                                {!item.has_reflections && (
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => handleDelete(item.id)}
                                        className="ml-2"
                                    >
                                        删除
                                    </Button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            {/* 添加/编辑模态框 */}
            <Modal
                show={showModal}
                onHide={() => setShowModal(false)}
                centered // 添加centered属性确保垂直居中
                size="lg" // 控制模态框大小
            >
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="h5">
                        {currentInspiration ? '编辑启发内容' : '添加新启发'}
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body className="pt-0">
                    {renderForm()}
                </Modal.Body>
            </Modal>
        </div>
    );
}