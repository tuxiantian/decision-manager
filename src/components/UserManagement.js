import React, { useState, useEffect } from 'react';
import { Table, Space, Button, Modal, Form, Input, Select, message, Popconfirm, Tag } from 'antd';
import { SearchOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';
import api from './api';

const { Option } = Select;
const { TextArea } = Input;

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });
    const [searchText, setSearchText] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [actionType, setActionType] = useState('freeze');
    const [form] = Form.useForm();

    const fetchUsers = async (params = {}) => {
        setLoading(true);
        try {
            const { current, pageSize } = pagination;
            const response = await api.get('/api/admin/users', {
                params: {
                    page: current,
                    per_page: pageSize,
                    search: searchText,
                    ...params,
                },
            });
            
            setUsers(response.data.users);
            setPagination({
                ...pagination,
                total: response.data.total,
                pages: response.data.pages,
            });
        } catch (error) {
            message.error('获取用户列表失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [pagination.current, searchText]);

    const handleTableChange = (pagination) => {
        setPagination(pagination);
    };

    const handleSearch = (value) => {
        setSearchText(value);
        setPagination({ ...pagination, current: 1 });
    };

    const showFreezeModal = (user, type) => {
        setCurrentUser(user);
        setActionType(type);
        setModalVisible(true);
        form.resetFields();
    };

    const handleAction = async () => {
        try {
            const values = await form.validateFields();
            const { reason, duration } = values;
            
            if (actionType === 'freeze') {
                await api.post(`/api/admin/users/${currentUser.id}/freeze`, {
                    reason,
                    duration,
                });
                message.success('用户已冻结');
            } else {
                await api.post(`/api/admin/users/${currentUser.id}/unfreeze`, {
                    reason,
                });
                message.success('用户已解冻');
            }
            
            setModalVisible(false);
            fetchUsers();
        } catch (error) {
            message.error('操作失败');
        }
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
        },
        {
            title: '用户名',
            dataIndex: 'username',
            key: 'username',
            render: (text, record) => (
                <Space>
                    {text}
                    {record.is_frozen && (
                        <Tag color="red">已冻结</Tag>
                    )}
                </Space>
            ),
        },
        {
            title: '邮箱',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: '注册时间',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (text) => new Date(text).toLocaleString(),
        },
        {
            title: '状态',
            dataIndex: 'is_frozen',
            key: 'status',
            render: (_, record) => (
                record.is_frozen ? (
                    <span>
                        冻结{record.frozen_until && `至 ${new Date(record.frozen_until).toLocaleString()}`}
                    </span>
                ) : (
                    <Tag color="green">正常</Tag>
                )
            ),
        },
        {
            title: '操作',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    {record.is_frozen ? (
                        <Button
                            type="primary"
                            icon={<UnlockOutlined />}
                            onClick={() => showFreezeModal(record, 'unfreeze')}
                        >
                            解冻
                        </Button>
                    ) : (
                        <Button
                            danger
                            icon={<LockOutlined />}
                            onClick={() => showFreezeModal(record, 'freeze')}
                        >
                            冻结
                        </Button>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: 24 }}>
            <div style={{ marginBottom: 16 }}>
                <Input
                    placeholder="搜索用户名或邮箱"
                    prefix={<SearchOutlined />}
                    onChange={(e) => handleSearch(e.target.value)}
                    style={{ width: 300 }}
                />
            </div>
            
            <Table
                columns={columns}
                rowKey="id"
                dataSource={users}
                pagination={pagination}
                loading={loading}
                onChange={handleTableChange}
                scroll={{ x: 1000 }}
            />
            
            <Modal
                title={actionType === 'freeze' ? '冻结用户' : '解冻用户'}
                visible={modalVisible}
                onOk={handleAction}
                onCancel={() => setModalVisible(false)}
                okText="确认"
                cancelText="取消"
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="reason"
                        label={actionType === 'freeze' ? '冻结原因' : '解冻原因'}
                        rules={[{ required: true, message: '请输入原因' }]}
                    >
                        <TextArea rows={4} placeholder="请输入详细原因..." />
                    </Form.Item>
                    
                    {actionType === 'freeze' && (
                        <Form.Item
                            name="duration"
                            label="冻结时长"
                            rules={[{ required: true, message: '请选择冻结时长' }]}
                        >
                            <Select placeholder="选择冻结时长">
                                <Option value="1week">一周</Option>
                                <Option value="1month">一个月</Option>
                                <Option value="1year">一年</Option>
                                <Option value="permanent">永久</Option>
                            </Select>
                        </Form.Item>
                    )}
                </Form>
            </Modal>
        </div>
    );
};

export default UserManagement;