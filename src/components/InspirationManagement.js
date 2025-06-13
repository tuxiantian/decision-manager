import { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Table, Tabs, Tab, Pagination, InputGroup, FormControl } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import "bootstrap-icons/font/bootstrap-icons.css";
import './InspirationManagement.css';
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

    // 分页和搜索状态
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10); // 每页显示的项目数
    const [totalItems, setTotalItems] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchType, setSearchType] = useState('all'); // 'all', 'text', 'image'

    const [hoveredImage, setHoveredImage] = useState(null);

    // 获取所有启发内容（带分页和搜索）
    const fetchInspirations = async () => {
        try {
            setLoading(true);
            const params = {
                page: currentPage,
                per_page: itemsPerPage,
                search: searchTerm,
                type: searchType === 'all' ? undefined : searchType
            };

            const response = await api.get('/api/admin/inspirations', { params });
            setInspirations(response.data.data || response.data);
            setTotalItems(response.data.total || response.data.length);
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    // 当页码、搜索条件或类型过滤变化时重新获取数据
    useEffect(() => {
        fetchInspirations();
    }, [currentPage, searchTerm, searchType]);

    // 重置页码到第一页并重新搜索
    const handleSearch = () => {
        setCurrentPage(1);
        fetchInspirations();
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
            formData.append('type', 'inspiration');

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
                type: 'image'
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

    // 计算总页数
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // 生成分页项
    const renderPagination = () => {
        let items = [];

        // 上一页按钮
        items.push(
            <Pagination.Prev
                key="prev"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
            />
        );

        // 页码按钮
        for (let number = 1; number <= totalPages; number++) {
            items.push(
                <Pagination.Item
                    key={number}
                    active={number === currentPage}
                    onClick={() => setCurrentPage(number)}
                >
                    {number}
                </Pagination.Item>
            );
        }

        // 下一页按钮
        items.push(
            <Pagination.Next
                key="next"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
            />
        );

        return <Pagination>{items}</Pagination>;
    };

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

            {/* 搜索和过滤区域 */}
            <div className="search-container mb-4">
                <InputGroup>
                    {/* 类型过滤选项放在左边 */}
                    <InputGroup.Text>
                        <div className="filter-options" style={{ whiteSpace: 'nowrap' }}>
                            <Form.Check
                                inline
                                type="radio"
                                label="全部"
                                name="typeFilter"
                                checked={searchType === 'all'}
                                onChange={() => setSearchType('all')}
                                className="me-2"
                            />
                            <Form.Check
                                inline
                                type="radio"
                                label="文字"
                                name="typeFilter"
                                checked={searchType === 'text'}
                                onChange={() => setSearchType('text')}
                                className="me-2"
                            />
                            <Form.Check
                                inline
                                type="radio"
                                label="图片"
                                name="typeFilter"
                                checked={searchType === 'image'}
                                onChange={() => setSearchType('image')}
                            />
                        </div>
                    </InputGroup.Text>

                    {/* 搜索框 */}
                    <FormControl
                        placeholder="搜索启发内容..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        style={{ maxWidth: '600px' }} // 限制搜索框宽度
                    />
                    {/* 清空按钮 - 只在有内容时显示 */}
                    {searchTerm && (
                        <InputGroup.Text
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                                setSearchTerm('');
                                handleSearch(); // 清空后立即触发搜索
                            }}
                        >
                            <i className="bi bi-x-lg"></i> {/* 使用Bootstrap图标 */}
                        </InputGroup.Text>
                    )}
                    {/* 搜索按钮 */}
                    <Button style={{
                        backgroundColor: '#4CAF50',
                        borderColor: '#4CAF50',
                        color: 'white'
                    }} onClick={handleSearch}>
                        搜索
                    </Button>
                </InputGroup>
            </div>

            {/* 图片预览层 */}
            {hoveredImage && (
                <div className="image-preview-overlay" onClick={() => setHoveredImage(null)}>
                    <div className="image-preview-container">
                        <img src={hoveredImage} alt="预览大图" />
                        <div className="image-preview-tooltip">点击任意位置关闭</div>
                    </div>
                </div>
            )}

            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th width="10%">类型</th>
                        <th width="60%">内容</th>
                        <th width="15%">创建时间</th>
                        <th width="15%">操作</th>
                    </tr>
                </thead>
                <tbody>
                    {inspirations.map(item => (
                        <tr key={item.id}>
                            <td>{item.type === 'text' ? '文字' : '图片'}</td>
                            <td className="content-cell">
                                {item.type === 'image' ? (
                                    <img src={item.content} onClick={() => setHoveredImage(item.content)} alt="启发图片" className="thumbnail" />
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

            {/* 分页控件 */}
            {totalPages > 1 && (
                <div className="pagination-container d-flex justify-content-center mt-4">
                    {renderPagination()}
                </div>
            )}

            {/* 添加/编辑模态框 */}
            <Modal
                show={showModal}
                onHide={() => setShowModal(false)}
                centered
                size="lg"
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