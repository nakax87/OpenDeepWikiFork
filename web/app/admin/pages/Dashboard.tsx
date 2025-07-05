'use client'

import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, Space, Tag, Table, Progress, Spin, Alert } from 'antd';
import {
  UserOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  EyeOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { 
  getDetailedStatistics, 
  DetailedStatistics,
  SystemStats,
  RecentRepository,
  RecentUser
} from '../../services/dashboardService';

const { Title, Text } = Typography;

export default function Dashboard() {
  const [stats, setStats] = useState<DetailedStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const {data} = await getDetailedStatistics();

      if (data) {
        setStats(data.data);
      } else {
        throw new Error(data.message || data.error || '获取统计数据失败');
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
      const errorMessage = error instanceof Error ? error.message : '获取统计数据失败，请稍后重试';
      setError(errorMessage);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return '#52c41a';
      case 'Pending':
        return '#faad14';
      case 'Processing':
        return '#1677ff';
      default:
        return '#8c8c8c';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Completed':
        return '已完成';
      case 'Pending':
        return '待处理';
      case 'Processing':
        return '处理中';
      default:
        return '未知';
    }
  };

  const getGrowthIcon = (rate: number) => {
    return rate >= 0 ? (
      <ArrowUpOutlined style={{ fontSize: '12px', color: '#52c41a' }} />
    ) : (
      <ArrowDownOutlined style={{ fontSize: '12px', color: '#ff4d4f' }} />
    );
  };

  const getGrowthColor = (rate: number) => {
    return rate >= 0 ? '#52c41a' : '#ff4d4f';
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px'
      }}>
        <Spin size="large" />
        <Text style={{ marginLeft: '16px', color: '#8c8c8c' }}>
          数据加载中...
        </Text>
      </div>
    );
  }

  if (!stats && error) {
    return (
      <div>
        <div style={{ marginBottom: '32px' }}>
          <Title level={2} style={{ 
            fontSize: '24px', 
            fontWeight: 600, 
            margin: 0,
            color: '#000000'
          }}>
            数据统计
          </Title>
          <Text style={{ 
            fontSize: '14px', 
            color: '#8c8c8c',
            marginTop: '8px',
            display: 'block'
          }}>
            系统运行概况与数据分析
          </Text>
        </div>
        
        <Alert
          message="数据加载失败"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: '24px' }}
          action={
            <Space>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ff4d4f',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                重新加载
              </button>
            </Space>
          }
        />
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px'
      }}>
        <Text style={{ color: '#8c8c8c' }}>暂无数据</Text>
      </div>
    );
  }

  // 统计卡片数据
  const statCards = [
    {
      title: '总用户数',
      value: stats.systemStats.totalUsers,
      icon: <UserOutlined />,
      color: '#1677ff',
      bgColor: '#e6f4ff',
      growth: `${stats.systemStats.userGrowthRate >= 0 ? '+' : ''}${stats.systemStats.userGrowthRate}%`,
      growthRate: stats.systemStats.userGrowthRate,
    },
    {
      title: '仓库数量',
      value: stats.systemStats.totalRepositories,
      icon: <DatabaseOutlined />,
      color: '#52c41a',
      bgColor: '#f6ffed',
      growth: `${stats.systemStats.repositoryGrowthRate >= 0 ? '+' : ''}${stats.systemStats.repositoryGrowthRate}%`,
      growthRate: stats.systemStats.repositoryGrowthRate,
    },
    {
      title: '文档数量',
      value: stats.systemStats.totalDocuments,
      icon: <FileTextOutlined />,
      color: '#722ed1',
      bgColor: '#f9f0ff',
      growth: `${stats.systemStats.documentGrowthRate >= 0 ? '+' : ''}${stats.systemStats.documentGrowthRate}%`,
      growthRate: stats.systemStats.documentGrowthRate,
    },
    {
      title: '总访问量',
      value: stats.systemStats.totalViews,
      icon: <EyeOutlined />,
      color: '#fa8c16',
      bgColor: '#fff7e6',
      growth: `${stats.systemStats.viewGrowthRate >= 0 ? '+' : ''}${stats.systemStats.viewGrowthRate}%`,
      growthRate: stats.systemStats.viewGrowthRate,
    },
  ];

  // 最近仓库表格列
  const recentRepositoryColumns = [
    {
      title: '仓库名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: RecentRepository) => (
        <div>
          <Text strong>{record.organizationName}/{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.description || '暂无描述'}
          </Text>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)} style={{ border: 'none' }}>
          {status === 'Completed' && <CheckCircleOutlined style={{ marginRight: '4px' }} />}
          {status !== 'Completed' && <ClockCircleOutlined style={{ marginRight: '4px' }} />}
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '文档数',
      dataIndex: 'documentCount',
      key: 'documentCount',
      render: (count: number) => (
        <Text>{count} 个</Text>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => (
        <Text type="secondary">{formatDate(date)}</Text>
      ),
    },
  ];

  // 最近用户表格列
  const recentUserColumns = [
    {
      title: '用户',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: RecentUser) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#1677ff',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 500,
            marginRight: '12px'
          }}>
            {text.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <Text strong>{text}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.email}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: '角色',
      dataIndex: 'roles',
      key: 'roles',
      render: (roles: string[]) => (
        <div>
          {roles.map((role, index) => (
            <Tag key={index} color={role === 'admin' ? '#ff4d4f' : '#1677ff'} style={{ border: 'none' }}>
              {role === 'admin' ? '管理员' : '用户'}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => (
        <Text type="secondary">{formatDate(date)}</Text>
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
          数据统计
        </Title>
        <Text style={{ 
          fontSize: '14px', 
          color: '#8c8c8c',
          marginTop: '8px',
          display: 'block'
        }}>
          系统运行概况与数据分析
        </Text>
      </div>
      
      {/* 统计卡片 */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        {statCards.map((card, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card 
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e8e8e8',
                borderRadius: '8px',
              }}
              bodyStyle={{ padding: '24px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <Text style={{ 
                    color: '#8c8c8c', 
                    fontSize: '14px',
                    fontWeight: 400,
                    display: 'block',
                    marginBottom: '8px'
                  }}>
                    {card.title}
                  </Text>
                  <Text style={{ 
                    fontSize: '32px', 
                    fontWeight: 600, 
                    color: '#000000',
                    display: 'block',
                    marginBottom: '16px',
                    lineHeight: '1'
                  }}>
                    {card.value.toLocaleString()}
                  </Text>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    fontSize: '12px',
                    fontWeight: 500
                  }}>
                    {getGrowthIcon(card.growthRate)}
                    <Text style={{ 
                      color: getGrowthColor(card.growthRate),
                      marginLeft: '4px',
                      marginRight: '8px'
                    }}>
                      {card.growth}
                    </Text>
                    <Text style={{ color: '#8c8c8c' }}>本月增长</Text>
                  </div>
                </div>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '8px',
                  backgroundColor: card.bgColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: card.color,
                  fontSize: '24px'
                }}>
                  {card.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
      
      {/* 详细信息 */}
      <Row gutter={[24, 24]}>
        {/* 最近创建的仓库 */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <DatabaseOutlined style={{ marginRight: '8px', color: '#52c41a' }} />
                <Text strong>最近创建的仓库</Text>
              </div>
            }
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e8e8e8',
              borderRadius: '8px',
            }}
            bodyStyle={{ padding: '0' }}
          >
            <Table
              columns={recentRepositoryColumns}
              dataSource={stats.recentRepositories}
              rowKey="name"
              pagination={false}
              size="small"
              style={{ borderRadius: '8px' }}
            />
          </Card>
        </Col>
        
        {/* 最近注册的用户 */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <UserOutlined style={{ marginRight: '8px', color: '#1677ff' }} />
                <Text strong>最近注册的用户</Text>
              </div>
            }
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e8e8e8',
              borderRadius: '8px',
            }}
            bodyStyle={{ padding: '0' }}
          >
            <Table
              columns={recentUserColumns}
              dataSource={stats.recentUsers}
              rowKey="name"
              pagination={false}
              size="small"
              style={{ borderRadius: '8px' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
} 