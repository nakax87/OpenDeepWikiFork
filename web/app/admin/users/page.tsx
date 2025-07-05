'use client'
import { Card, Table, Button, Input, Space, Tag, Dropdown, Modal, Form, Select, Switch, message, Typography } from 'antd';
import {
  UserOutlined,
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useState, useEffect } from 'react';
import { getUserList, createUser, updateUser, deleteUser, UserInfo, CreateUserRequest, UpdateUserRequest } from '../../services/userService';
import { roleService, Role } from '../../services/roleService';

const { Title, Text } = Typography;

export default function UsersPage() {
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
  const [form] = Form.useForm();

  // 加载角色数据
  const loadRoles = async () => {
    try {
      setRolesLoading(true);
      const response = await roleService.getRoleList(1, 100, '', true); // 只获取激活的角色
      setRoles(response.items);
    } catch (error) {
      console.error('加载角色数据失败:', error);
      message.error('加载角色数据失败');
    } finally {
      setRolesLoading(false);
    }
  };

  // 加载用户数据
  const loadUsers = async (page = currentPage, size = pageSize, keyword = searchText) => {
    try {
      setLoading(true);
      const response = await getUserList(page, size, keyword);
      if (response.code === 200) {
        setUsers(response.data.items);
        setTotal(response.data.total);
      } else {
        message.error(response.message || '获取用户列表失败');
      }
    } catch (error) {
      console.error('加载用户数据失败:', error);
      message.error('加载用户数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  // 处理搜索
  const handleSearch = () => {
    setCurrentPage(1); // 重置到第一页
    loadUsers(1, pageSize, searchText);
  };

  // 处理分页变化
  const handleTableChange = (pagination: any) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
    loadUsers(pagination.current, pagination.pageSize, searchText);
  };

  // 处理用户操作（编辑、删除等）
  const handleUserAction = async (action: string, user: UserInfo) => {
    if (action === 'edit') {
      setCurrentUser(user);
      form.setFieldsValue({
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.role !== 'inactive', // 假设inactive角色表示禁用状态
      });
      setIsModalOpen(true);
    } else if (action === 'delete') {
      Modal.confirm({
        title: '确认删除',
        content: `确定要删除用户 ${user.name} 吗？此操作不可恢复。`,
        okText: '删除',
        okType: 'danger',
        cancelText: '取消',
        onOk: async () => {
          try {
            const response = await deleteUser(user.id);
            if (response.code === 200 && response.data) {
              message.success('用户删除成功');
              loadUsers(); // 重新加载用户列表
            } else {
              message.error(response.message || '删除用户失败');
            }
          } catch (error) {
            console.error('删除用户失败:', error);
            message.error('删除用户失败');
          }
        },
      });
    }
  };

  // 处理表单提交（创建/更新用户）
  const handleFormSubmit = () => {
    form.validateFields().then(async (values) => {
      try {
        if (currentUser) {
          // 更新用户
          const updateData: UpdateUserRequest = {
            name: values.name,
            email: values.email,
            role: values.role,
            password: values.password, // 如果没有输入密码，会是undefined
          };

          const response = await updateUser(currentUser.id, updateData);
          if (response.code === 200) {
            message.success('用户更新成功');
            setIsModalOpen(false);
            loadUsers(); // 重新加载用户列表
          } else {
            message.error(response.message || '更新用户失败');
          }
        } else {
          // 创建用户
          const createData: CreateUserRequest = {
            name: values.name,
            email: values.email,
            password: values.password,
            role: values.role,
          };

          const { data } = await createUser(createData) as any;
          if (data.code === 200) {
            message.success('用户创建成功');
            setIsModalOpen(false);
            loadUsers(); // 重新加载用户列表
          } else {
            message.error(data.message || '创建用户失败');
          }
        }
      } catch (error) {
        console.error('提交表单失败:', error);
        message.error('操作失败，请重试');
      }
    });
  };

  // 创建新用户
  const handleAddUser = () => {
    setCurrentUser(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  // 根据角色获取标签颜色和样式
  const getRoleTagProps = (role: string) => {
    if (role === 'admin' || role === '管理员') {
      return {
        color: '#ff4d4f',
        backgroundColor: '#fff2f0',
        border: 'none',
        fontWeight: 500,
      };
    } else {
      return {
        color: '#1677ff',
        backgroundColor: '#e6f4ff',
        border: 'none',
        fontWeight: 500,
      };
    }
  };

  // 表格列定义
  const columns: ColumnsType<UserInfo> = [
    {
      title: '用户名',
      dataIndex: 'name',
      key: 'name',
      render: (text) => (
        <Text strong style={{ color: '#000000' }}>
          {text}
        </Text>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      render: (text) => (
        <Text style={{ color: '#8c8c8c' }}>
          {text}
        </Text>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        const roleInfo = roles.find(r => r.name === role);
        const displayName = roleInfo ? roleInfo.name : role;
        const tagProps = getRoleTagProps(role);
        
        return (
          <Tag
            style={{
              color: tagProps.color,
              backgroundColor: tagProps.backgroundColor,
              border: tagProps.border,
              fontWeight: tagProps.fontWeight,
              borderRadius: '4px',
              padding: '2px 8px',
            }}
          >
            {displayName}
          </Tag>
        );
      },
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      render: (text) => (
        <Text style={{ color: '#8c8c8c' }}>
          {text ? new Date(text).toLocaleString() : '从未登录'}
        </Text>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text) => (
        <Text style={{ color: '#8c8c8c' }}>
          {new Date(text).toLocaleString()}
        </Text>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'edit',
                icon: <EditOutlined />,
                label: '编辑',
                onClick: () => handleUserAction('edit', record),
              },
              {
                type: 'divider',
              },
              {
                key: 'delete',
                icon: <DeleteOutlined />,
                label: '删除',
                danger: true,
                onClick: () => handleUserAction('delete', record),
              },
            ],
          }}
        >
          <Button 
            type="text" 
            icon={<MoreOutlined />}
            style={{
              color: '#8c8c8c',
              borderRadius: '4px',
            }}
          />
        </Dropdown>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <Title level={2} style={{ 
          fontSize: '24px', 
          fontWeight: 600, 
          margin: 0,
          color: '#000000'
        }}>
          用户管理
        </Title>
        <Text style={{ 
          fontSize: '14px', 
          color: '#8c8c8c',
          marginTop: '8px',
          display: 'block'
        }}>
          管理系统用户和权限设置
        </Text>
      </div>

      <Card style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e8e8e8',
        borderRadius: '8px',
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '24px' 
        }}>
          <Space>
            <Input
              placeholder="搜索用户名或邮箱"
              prefix={<SearchOutlined />}
              style={{ 
                width: 300,
                borderRadius: '4px',
                border: '1px solid #e8e8e8',
              }}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
            />
            <Button 
              type="primary" 
              onClick={handleSearch}
              style={{
                backgroundColor: '#1677ff',
                borderColor: '#1677ff',
                borderRadius: '4px',
                fontWeight: 500,
              }}
            >
              搜索
            </Button>
          </Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddUser}
            style={{
              backgroundColor: '#1677ff',
              borderColor: '#1677ff',
              borderRadius: '4px',
              fontWeight: 500,
            }}
          >
            添加用户
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
            style: {
              marginTop: '24px',
            },
          }}
          onChange={handleTableChange}
          style={{
            borderRadius: '8px',
          }}
        />
      </Card>

      {/* 用户编辑/创建表单 */}
      <Modal
        title={
          <Text strong style={{ fontSize: '16px', color: '#000000' }}>
            {currentUser ? "编辑用户" : "添加用户"}
          </Text>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleFormSubmit}
        okText={currentUser ? "保存" : "创建"}
        cancelText="取消"
        okButtonProps={{
          style: {
            backgroundColor: '#1677ff',
            borderColor: '#1677ff',
            borderRadius: '4px',
            fontWeight: 500,
          }
        }}
        cancelButtonProps={{
          style: {
            borderColor: '#e8e8e8',
            borderRadius: '4px',
            fontWeight: 500,
          }
        }}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: '24px' }}
        >
          <Form.Item
            name="name"
            label={<Text strong style={{ color: '#000000' }}>用户名</Text>}
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="用户名"
              style={{
                borderRadius: '4px',
                border: '1px solid #e8e8e8',
              }}
            />
          </Form.Item>

          <Form.Item
            name="email"
            label={<Text strong style={{ color: '#000000' }}>邮箱</Text>}
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱' }
            ]}
          >
            <Input 
              placeholder="邮箱地址"
              style={{
                borderRadius: '4px',
                border: '1px solid #e8e8e8',
              }}
            />
          </Form.Item>

          {!currentUser && (
            <Form.Item
              name="password"
              label={<Text strong style={{ color: '#000000' }}>密码</Text>}
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password 
                placeholder="密码"
                style={{
                  borderRadius: '4px',
                  border: '1px solid #e8e8e8',
                }}
              />
            </Form.Item>
          )}

          {currentUser && (
            <Form.Item
              name="password"
              label={<Text strong style={{ color: '#000000' }}>密码</Text>}
              help={<Text style={{ color: '#8c8c8c' }}>如需修改密码请输入新密码，否则留空</Text>}
            >
              <Input.Password 
                placeholder="新密码（可选）"
                style={{
                  borderRadius: '4px',
                  border: '1px solid #e8e8e8',
                }}
              />
            </Form.Item>
          )}

          <Form.Item
            name="role"
            label={<Text strong style={{ color: '#000000' }}>角色</Text>}
            rules={[{ required: true, message: '请选择角色' }]}
            initialValue="user"
          >
            <Select 
              placeholder="请选择角色"
              loading={rolesLoading}
              disabled={rolesLoading}
              style={{
                borderRadius: '4px',
              }}
            >
              {roles.map(role => (
                <Select.Option key={role.id} value={role.name}>
                  {role.name}
                  {role.description && ` - ${role.description}`}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
} 