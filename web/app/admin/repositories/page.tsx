'use client'
import { Card, Table, Button, Input, Space, Tag, Dropdown, Modal, Form, Select, Badge, Avatar, message, Typography, Switch } from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  StarOutlined,
  MoreOutlined,
  FolderOutlined,
  ClockCircleOutlined,
  UserOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useState, useEffect } from 'react';
import { getRepositoryList, createGitRepository, updateRepository, deleteRepository, resetRepository, RepositoryInfo, CreateGitRepositoryRequest, UpdateRepositoryRequest } from '../../services/repositoryService';
import Link from 'next/link';
import { Tooltip } from '@lobehub/ui';

const { Title, Text } = Typography;

// 仓库状态映射 - 优化色彩方案
const statusMap = {
  0: { 
    text: '待处理', 
    color: '#faad14',
    backgroundColor: '#fff7e6',
    borderColor: '#faad14'
  },
  1: { 
    text: '处理中', 
    color: '#1677ff',
    backgroundColor: '#e6f4ff',
    borderColor: '#1677ff'
  },
  2: { 
    text: '已完成', 
    color: '#52c41a',
    backgroundColor: '#f6ffed',
    borderColor: '#52c41a'
  },
  3: { 
    text: '已取消', 
    color: '#8c8c8c',
    backgroundColor: '#f5f5f5',
    borderColor: '#8c8c8c'
  },
  4: { 
    text: '未授权', 
    color: '#ff4d4f',
    backgroundColor: '#fff2f0',
    borderColor: '#ff4d4f'
  },
  99: { 
    text: '已失败', 
    color: '#ff4d4f',
    backgroundColor: '#fff2f0',
    borderColor: '#ff4d4f'
  }
};

export default function RepositoriesPage() {
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [repositories, setRepositories] = useState<RepositoryInfo[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentRepository, setCurrentRepository] = useState<RepositoryInfo | null>(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  // 加载仓库数据
  const loadRepositories = async (page = currentPage, size = pageSize, keyword = searchText) => {
    try {
      setLoading(true);
      const { code, data } = await getRepositoryList(page, size, keyword);
      if (code === 200) {
        setRepositories(data.items);
        setTotal(data.total);
      } else {
        message.error('获取仓库列表失败');
      }
    } catch (error) {
      console.error('加载仓库数据失败:', error);
      message.error('加载仓库数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadRepositories();
  }, []);

  // 处理搜索
  const handleSearch = () => {
    setCurrentPage(1); // 重置到第一页
    loadRepositories(1, pageSize, searchText);
  };

  // 处理分页变化
  const handleTableChange = (pagination: any) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
    loadRepositories(pagination.current, pagination.pageSize, searchText);
  };

  // 处理仓库操作（编辑、删除等）
  const handleRepositoryAction = async (action: string, repository: RepositoryInfo) => {
    if (action === 'edit') {
      setCurrentRepository(repository);
      editForm.setFieldsValue({
        description: repository.description,
        isRecommended: repository.isRecommended,
        prompt: repository.prompt,
      });
      setIsEditModalOpen(true);
    } else if (action === 'delete') {
      Modal.confirm({
        title: '确认删除',
        content: `确定要删除仓库 ${repository.organizationName}/${repository.name} 吗？此操作不可恢复。`,
        okText: '删除',
        okType: 'danger',
        cancelText: '取消',
        onOk: async () => {
          try {
            const response = await deleteRepository(repository.id);
            if (response.code === 200 && response.data) {
              message.success('仓库删除成功');
              loadRepositories(); // 重新加载仓库列表
            } else {
              message.error(response.message || '删除仓库失败');
            }
          } catch (error) {
            console.error('删除仓库失败:', error);
            message.error('删除仓库失败');
          }
        },
      });
    } else if (action === 'reprocess') {
      Modal.confirm({
        title: '确认重新处理',
        content: `确定要重新处理仓库 ${repository.organizationName}/${repository.name} 吗？`,
        okText: '确定',
        cancelText: '取消',
        onOk: async () => {
          try {
            const response = await resetRepository(repository.id);
            if (response.code === 200 && response.data) {
              message.success('已提交重新处理请求');
              loadRepositories(); // 重新加载仓库列表
            } else {
              message.error(response.message || '提交重新处理请求失败');
            }
          } catch (error) {
            console.error('重新处理仓库失败:', error);
            message.error('重新处理仓库失败');
          }
        },
      });
    }
  };

  // 处理创建仓库表单提交
  const handleFormSubmit = () => {
    form.validateFields().then(async (values) => {
      try {
        // 创建Git仓库
        const createData: CreateGitRepositoryRequest = {
          address: values.address,
          branch: values.branch,
          gitUserName: values.enableGitAuth ? values.gitUserName : undefined,
          gitPassword: values.enableGitAuth ? values.gitPassword : undefined,
        };

        const response = await createGitRepository(createData);
        if (response.code === 200) {
          message.success('仓库创建成功');
          setIsModalOpen(false);
          loadRepositories(); // 重新加载仓库列表
        } else {
          message.error(response.message || '创建仓库失败');
        }
      } catch (error) {
        console.error('提交表单失败:', error);
        message.error('操作失败，请重试');
      }
    });
  };

  // 处理编辑仓库表单提交
  const handleEditFormSubmit = () => {
    if (!currentRepository) return;

    editForm.validateFields().then(async (values) => {
      try {
        // 更新仓库
        const updateData: UpdateRepositoryRequest = {
          description: values.description,
          isRecommended: values.isRecommended,
          prompt: values.prompt,
        };

        const response = await updateRepository(currentRepository.id, updateData);
        if (response.code === 200) {
          message.success('仓库更新成功');
          setIsEditModalOpen(false);
          loadRepositories(); // 重新加载仓库列表
        } else {
          message.error(response.message || '更新仓库失败');
        }
      } catch (error) {
        console.error('提交表单失败:', error);
        message.error('操作失败，请重试');
      }
    });
  };

  // 创建新仓库
  const handleAddRepository = () => {
    form.resetFields();
    setIsModalOpen(true);
  };

  // 表格列定义
  const columns: ColumnsType<RepositoryInfo> = [
    {
      title: '仓库名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
            <FolderOutlined style={{ 
              fontSize: '16px', 
              color: '#1677ff',
              marginRight: '8px' 
            }} />
            <Link href={`/admin/repositories/${record.id}`} passHref>
              <Text strong style={{ 
                color: '#000000',
                textDecoration: 'none',
                fontSize: '14px'
              }}>
                {record.organizationName}/{text}
              </Text>
            </Link>
          </div>
          {record.isRecommended && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <StarOutlined style={{ 
                fontSize: '12px', 
                color: '#faad14',
                marginRight: '4px' 
              }} />
              <Text style={{ 
                fontSize: '12px',
                color: '#faad14',
                fontWeight: 500
              }}>
                推荐
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (text) => (
        <Text style={{ 
          color: '#8c8c8c',
          fontSize: '14px'
        }}>
          {text || '暂无描述'}
        </Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusInfo = statusMap[status as keyof typeof statusMap];
        return (
          <Tag
            style={{
              color: statusInfo.color,
              backgroundColor: statusInfo.backgroundColor,
              border: 'none',
              borderRadius: '4px',
              padding: '2px 8px',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            {statusInfo.text}
          </Tag>
        );
      },
    },
    {
      title: '文档数',
      dataIndex: 'documentCount',
      key: 'documentCount',
      render: (count) => (
        <Text style={{ 
          color: '#000000',
          fontSize: '14px',
          fontWeight: 500
        }}>
          {count || 0}
        </Text>
      ),
    },
    {
      title: '分支',
      dataIndex: 'branch',
      key: 'branch',
      render: (branch) => (
        <Tag
          style={{
            color: '#1677ff',
            backgroundColor: '#e6f4ff',
            border: 'none',
            borderRadius: '4px',
            padding: '2px 8px',
            fontSize: '12px',
            fontWeight: 500,
          }}
        >
          {branch || 'main'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text) => (
        <Text style={{ 
          color: '#8c8c8c',
          fontSize: '14px'
        }}>
          {new Date(text).toLocaleDateString()}
        </Text>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'view',
                icon: <EyeOutlined />,
                label: '查看',
                onClick: () => window.open(`/admin/repositories/${record.id}`, '_blank'),
              },
              {
                key: 'edit',
                icon: <EditOutlined />,
                label: '编辑',
                onClick: () => handleRepositoryAction('edit', record),
              },
              {
                key: 'reprocess',
                icon: <ReloadOutlined />,
                label: '重新处理',
                onClick: () => handleRepositoryAction('reprocess', record),
              },
              {
                type: 'divider',
              },
              {
                key: 'delete',
                icon: <DeleteOutlined />,
                label: '删除',
                danger: true,
                onClick: () => handleRepositoryAction('delete', record),
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
          仓库管理
        </Title>
        <Text style={{ 
          fontSize: '14px', 
          color: '#8c8c8c',
          marginTop: '8px',
          display: 'block'
        }}>
          管理 Git 仓库和文档处理状态
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
              placeholder="搜索仓库名称或描述"
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
            onClick={handleAddRepository}
            style={{
              backgroundColor: '#1677ff',
              borderColor: '#1677ff',
              borderRadius: '4px',
              fontWeight: 500,
            }}
          >
            添加仓库
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={repositories}
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

      {/* 创建仓库表单 */}
      <Modal
        title={
          <Text strong style={{ fontSize: '16px', color: '#000000' }}>
            添加仓库
          </Text>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleFormSubmit}
        okText="创建"
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
          initialValues={{ 
            branch: 'main',
            enableGitAuth: false
          }}
          style={{ marginTop: '24px' }}
        >
          <Form.Item
            name="address"
            label={<Text strong style={{ color: '#000000' }}>仓库地址</Text>}
            rules={[
              { required: true, message: '请输入仓库地址' },
              { type: 'url', message: '请输入有效的URL' }
            ]}
          >
            <Input 
              placeholder="https://github.com/owner/repo.git"
              style={{
                borderRadius: '4px',
                border: '1px solid #e8e8e8',
              }}
            />
          </Form.Item>

          <Form.Item
            name="branch"
            label={<Text strong style={{ color: '#000000' }}>分支</Text>}
            rules={[{ required: true, message: '请输入分支名称' }]}
          >
            <Input 
              placeholder="main"
              style={{
                borderRadius: '4px',
                border: '1px solid #e8e8e8',
              }}
            />
          </Form.Item>

          <Form.Item
            name="enableGitAuth"
            valuePropName="checked"
            label={<Text strong style={{ color: '#000000' }}>启用Git认证</Text>}
          >
            <Switch 
              checkedChildren="开启" 
              unCheckedChildren="关闭"
            />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.enableGitAuth !== currentValues.enableGitAuth}
          >
            {({ getFieldValue }) => {
              return getFieldValue('enableGitAuth') ? (
                <>
                  <Form.Item
                    name="gitUserName"
                    label={<Text strong style={{ color: '#000000' }}>Git用户名</Text>}
                    rules={[{ required: true, message: '请输入Git用户名' }]}
                  >
                    <Input 
                      placeholder="Git用户名"
                      style={{
                        borderRadius: '4px',
                        border: '1px solid #e8e8e8',
                      }}
                    />
                  </Form.Item>

                  <Form.Item
                    name="gitPassword"
                    label={<Text strong style={{ color: '#000000' }}>Git密码/Token</Text>}
                    rules={[{ required: true, message: '请输入Git密码或Token' }]}
                  >
                    <Input.Password 
                      placeholder="Git密码或Personal Access Token"
                      style={{
                        borderRadius: '4px',
                        border: '1px solid #e8e8e8',
                      }}
                    />
                  </Form.Item>
                </>
              ) : null;
            }}
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑仓库表单 */}
      <Modal
        title={
          <Text strong style={{ fontSize: '16px', color: '#000000' }}>
            编辑仓库
          </Text>
        }
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        onOk={handleEditFormSubmit}
        okText="保存"
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
          form={editForm}
          layout="vertical"
          style={{ marginTop: '24px' }}
        >
          <Form.Item
            name="description"
            label={<Text strong style={{ color: '#000000' }}>描述</Text>}
          >
            <Input.TextArea 
              placeholder="仓库描述"
              rows={3}
              style={{
                borderRadius: '4px',
                border: '1px solid #e8e8e8',
              }}
            />
          </Form.Item>

          <Form.Item
            name="isRecommended"
            valuePropName="checked"
            label={<Text strong style={{ color: '#000000' }}>推荐仓库</Text>}
          >
            <Switch 
              checkedChildren="推荐" 
              unCheckedChildren="普通"
            />
          </Form.Item>

          <Form.Item
            name="prompt"
            label={<Text strong style={{ color: '#000000' }}>提示词</Text>}
          >
            <Input.TextArea 
              placeholder="自定义提示词"
              rows={4}
              style={{
                borderRadius: '4px',
                border: '1px solid #e8e8e8',
              }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
} 