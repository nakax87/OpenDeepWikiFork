'use client'

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Layout, Menu, Button, Avatar, Dropdown, Space, Typography } from 'antd';
import {
  MenuOutlined,
  DashboardOutlined,
  UserOutlined,
  DatabaseOutlined,
  SettingOutlined,
  ApiOutlined,
  LogoutOutlined,
  TeamOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import { menuService, MenuItem, UserMenu } from '../services/menuService';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

// 菜单项类型定义
interface MenuItemType {
  key: string;
  icon: React.ReactNode;
  label: string;
  children?: MenuItemType[];
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('管理员');
  const [userRole, setUserRole] = useState('user');
  const [userMenu, setUserMenu] = useState<UserMenu | null>(null);
  const [openKeys, setOpenKeys] = useState<string[]>([]); // 添加菜单展开状态
  const pathname = usePathname();
  const router = useRouter();

  // 获取当前激活的菜单项
  const getActiveKey = () => {
    if (pathname === '/admin') return 'dashboard';
    if (pathname.startsWith('/admin/users')) return 'users';
    if (pathname.startsWith('/admin/repositories')) return 'repositories';
    if (pathname.startsWith('/admin/finetune')) return 'finetune';
    if (pathname.startsWith('/admin/roles')) return 'roles';
    if (pathname.startsWith('/admin/permissions')) return 'permissions';
    if (pathname.startsWith('/admin/settings')) return 'settings';
    return 'dashboard';
  };

  // 初始化菜单展开状态
  const getInitialOpenKeys = () => {
    if (pathname.startsWith('/admin/permissions')) return ['permissions'];
    if (pathname.startsWith('/admin/roles')) return ['permissions'];
    return [];
  };

  // 导航菜单配置
  const getNavItems = (): MenuItemType[] => {
    const allItems: MenuItemType[] = [
      {
        key: 'dashboard',
        icon: <DashboardOutlined />,
        label: '数据统计',
      },
      {
        key: 'users',
        icon: <UserOutlined />,
        label: '用户管理',
      },
      {
        key: 'repositories',
        icon: <DatabaseOutlined />,
        label: '仓库管理',
      },
      {
        key: 'finetune',
        icon: <ApiOutlined />,
        label: '数据微调',
      },
      {
        key: 'permissions',
        icon: <KeyOutlined />,
        label: '权限管理',
        children: [
          {
            key: 'roles',
            icon: <TeamOutlined />,
            label: '角色管理',
          },
          {
            key: 'permissions-roles',
            icon: <KeyOutlined />,
            label: '角色权限',
          },
          {
            key: 'permissions-users',
            icon: <UserOutlined />,
            label: '用户角色',
          },
        ],
      },
      {
        key: 'settings',
        icon: <SettingOutlined />,
        label: '系统设置',
      },
    ];

    if (userRole === 'admin') {
      return allItems;
    } else {
      // 普通用户显示：数据统计、仓库管理、数据微调、系统设置
      return [
        allItems[0], // 数据统计
        allItems[2], // 仓库管理
        allItems[3], // 数据微调
        allItems[5], // 系统设置
      ];
    }
  };

  // 用户下拉菜单
  const userMenuItems = [
    {
      key: 'profile',
      label: '个人信息',
      icon: <UserOutlined />,
    },
    {
      key: 'settings',
      label: '设置',
      icon: <SettingOutlined />,
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      danger: true,
    },
  ];

  // 检查用户是否已登录
  useEffect(() => {
    const checkLoginStatus = async () => {
      const userToken = localStorage.getItem('userToken') || localStorage.getItem('token');
      if (!userToken) {
        localStorage.setItem('redirectPath', pathname);
        router.push('/login');
      } else {
        setIsLoggedIn(true);
        const storedUserName = localStorage.getItem('userName');
        if (storedUserName) {
          setUserName(storedUserName);
        }
        
        const userInfoStr = localStorage.getItem('userInfo');
        if (userInfoStr) {
          try {
            const userInfo = JSON.parse(userInfoStr);
            if (userInfo.role) {
              setUserRole(userInfo.role);
            } else {
              setUserRole('user');
            }
          } catch (error) {
            console.error('解析用户信息失败:', error);
            setUserRole('user');
          }
        } else {
          setUserRole('user');
        }
      }
      setIsLoading(false);
    };
    
    checkLoginStatus();
  }, [router, pathname]);

  // 初始化菜单展开状态
  useEffect(() => {
    setOpenKeys(getInitialOpenKeys());
  }, [pathname]);

  // 处理菜单展开/收起
  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys);
  };

  // 处理登出
  const handleLogout = () => {
    console.log('用户退出登录');
    localStorage.removeItem('userToken');
    localStorage.removeItem('userName');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('redirectPath');
    
    setIsLoggedIn(false);
    setUserName('管理员');
    setUserRole('user');
    
    router.push('/login');
  };

  // 处理菜单点击
  const handleMenuClick = (e: any) => {
    const key = e.key;
    switch (key) {
      case 'dashboard':
        router.push('/admin');
        break;
      case 'users':
        router.push('/admin/users');
        break;
      case 'repositories':
        router.push('/admin/repositories');
        break;
      case 'finetune':
        router.push('/admin/finetune');
        break;
      case 'roles':
        router.push('/admin/roles');
        break;
      case 'permissions-roles':
        router.push('/admin/permissions/roles');
        break;
      case 'permissions-users':
        router.push('/admin/permissions/users');
        break;
      case 'settings':
        router.push('/admin/settings');
        break;
      default:
        break;
    }
  };

  // 处理用户菜单点击
  const handleUserMenuClick = (e: any) => {
    const key = e.key;
    switch (key) {
      case 'profile':
        router.push('/admin/settings/profile');
        break;
      case 'settings':
        router.push('/admin/settings');
        break;
      case 'logout':
        handleLogout();
        break;
      default:
        break;
    }
  };

  // 如果正在加载，显示加载状态
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#ffffff'
      }}>
        <Text>加载中...</Text>
      </div>
    );
  }

  // 如果未登录，将由useEffect重定向到登录页面
  if (!isLoggedIn) {
    return null;
  }

  return (
    <Layout style={{ 
      height: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      overflow: 'hidden', // 防止整体滚动
    }}>
      {/* 侧边栏 */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e8e8e8',
          boxShadow: 'none',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          overflow: 'auto', // 允许侧边栏内部滚动
        }}
        width={240}
      >
        {/* Logo区域 */}
        <div style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? '0' : '0 24px',
          borderBottom: '1px solid #e8e8e8',
          backgroundColor: '#ffffff',
          position: 'sticky',
          top: 0,
          zIndex: 101,
        }}>
          {!collapsed && (
            <Text strong style={{ 
              fontSize: '18px',
              color: '#000000',
              fontWeight: 600
            }}>
              KoalaWiki
            </Text>
          )}
          {collapsed && (
            <div style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#000000',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: 600
            }}>
              K
            </div>
          )}
        </div>
        
        {/* 菜单 */}
        <Menu
          mode="inline"
          selectedKeys={[getActiveKey()]}
          openKeys={openKeys}
          onOpenChange={handleOpenChange}
          items={getNavItems()}
          onClick={handleMenuClick}
          style={{
            backgroundColor: '#ffffff',
            border: 'none',
            fontSize: '14px',
            fontWeight: 400,
            height: 'calc(100vh - 64px)', // 减去logo区域高度
            overflow: 'auto', // 菜单可滚动
          }}
        />
      </Sider>
      
      {/* 主内容区域 */}
      <Layout style={{ 
        marginLeft: collapsed ? 80 : 240,
        height: '100vh',
        overflow: 'hidden', // 防止布局容器滚动
      }}>
        {/* 头部 */}
        <Header style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e8e8e8',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px',
          position: 'sticky',
          top: 0,
          zIndex: 99,
        }}>
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          />
          
          <Dropdown
            menu={{ 
              items: userMenuItems,
              onClick: handleUserMenuClick
            }}
            placement="bottomRight"
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '4px',
              transition: 'background-color 0.2s',
            }}>
              <Avatar
                size={32}
                style={{
                  backgroundColor: '#000000',
                  marginRight: '8px',
                  fontSize: '14px',
                  fontWeight: 500
                }}
              >
                {userName.slice(0, 1).toUpperCase()}
              </Avatar>
              <Text style={{ 
                color: '#000000',
                fontSize: '14px',
                fontWeight: 500
              }}>
                {userName}
              </Text>
            </div>
          </Dropdown>
        </Header>
        
        {/* 内容区域 */}
        <Content style={{
          margin: '24px',
          padding: '24px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e8e8e8',
          height: 'calc(100vh - 112px)', // 减去头部和边距
          overflow: 'auto', // 只有内容区域滚动
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
} 