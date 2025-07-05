/**
 * KoalaWiki AI Chat Widget
 * 第三方网站引用的聊天悬浮球脚本
 * 
 * 使用方式:
 * <script src="https://your-domain.com/koala-chat-widget.js"></script>
 * <script>
 *   KoalaChatWidget.init({
 *     appId: 'your-app-id',
 *     organizationName: 'your-org',
 *     repositoryName: 'your-repo',
 *     title: '我的 AI 助手',
 *     expandIcon: 'base64-icon-data',
 *     closeIcon: 'base64-icon-data',
 *     apiUrl: 'https://your-api-domain.com',
 *     allowedDomains: ['example.com', 'subdomain.example.com'],
 *     enableDomainValidation: true
 *   });
 * </script>
 */

(function() {
  'use strict';

  // 全局配置
  let config = {
    appId: '',
    organizationName: 'default',
    repositoryName: 'default',
    title: 'AI 助手',
    expandIcon: '',
    closeIcon: '',
    apiUrl: '',
    allowedDomains: [],
    enableDomainValidation: false,
    theme: 'auto', // 默认使用auto主题
    // 提示相关配置
    enableTooltip: true,
    tooltipText: '点击我询问您想知道的！',
    tooltipDelay: 5000, // 5秒后显示提示
    tooltipDuration: 3000, // 提示显示3秒后自动隐藏
    tooltipRepeatDelay: 30000 // 提示消失后30秒才能再次显示
  };

  // 用户活动检测相关变量
  let lastActivity = Date.now();
  let tooltipTimer = null;
  let tooltipHideTimer = null;
  let tooltipElement = null;
  let tooltipShown = false;
  let lastTooltipHideTime = 0;

  // 主题相关变量
  let currentTheme = 'light';
  let mediaQuery = null;
  let themeObserver = null;

  // 主题检测和管理
  function detectTheme() {
    if (config.theme === 'auto') {
      // 检测系统主题
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
      return 'light';
    }
    return config.theme;
  }

  // 初始化主题监听
  function initThemeListener() {
    if (config.theme === 'auto') {
      // 监听系统主题变化
      if (window.matchMedia) {
        mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', handleThemeChange);
      }
    }
    
    // 监听用户手动切换主题（通过网页的主题切换器）
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'class' || mutation.attributeName === 'data-theme')) {
          handleThemeChange();
        }
      });
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme']
    });
    
    themeObserver = observer;
  }

  // 处理主题变化
  function handleThemeChange() {
    const newTheme = detectTheme();
    if (newTheme !== currentTheme) {
      currentTheme = newTheme;
      updateThemeStyles();
    }
  }

  // 更新主题样式
  function updateThemeStyles() {
    const styleElement = document.getElementById('koala-chat-widget-styles');
    if (styleElement) {
      styleElement.textContent = getThemeStyles();
    }
    
    // 更新悬浮球样式
    if (floatingButton) {
      updateFloatingButtonTheme();
    }
  }

  // 更新悬浮球主题
  function updateFloatingButtonTheme() {
    if (!floatingButton) return;
    
    const hasCustomIcon = floatingButton.classList.contains('koala-floating-button-custom-icon');
    
    floatingButton.className = `koala-floating-button koala-floating-button-${currentTheme}`;
    
    // 如果有自定义图标，重新添加自定义图标类
    if (hasCustomIcon) {
      floatingButton.classList.add('koala-floating-button-custom-icon');
    }
    
    // 更新动画效果
    floatingButton.style.animation = 'none';
    setTimeout(() => {
      floatingButton.style.animation = '';
    }, 10);
  }

  // 获取主题样式
  function getThemeStyles() {
    const lightTheme = {
      buttonBg: 'linear-gradient(135deg, #1677ff 0%, #0958d9 100%)',
      buttonHoverBg: 'linear-gradient(135deg, #0958d9 0%, #003eb3 100%)',
      buttonShadow: '0 4px 20px rgba(22, 119, 255, 0.25)',
      buttonHoverShadow: '0 6px 30px rgba(22, 119, 255, 0.35)',
      containerBg: '#ffffff',
      containerBorder: '#e5e5e5',
      headerBg: '#ffffff',
      headerBorder: '#e5e5e5',
      textColor: '#262626',
      textColorSecondary: '#8c8c8c',
      tooltipBg: 'rgba(0, 0, 0, 0.85)',
      tooltipColor: '#ffffff'
    };

    const darkTheme = {
      buttonBg: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      buttonHoverBg: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
      buttonShadow: '0 4px 20px rgba(59, 130, 246, 0.25)',
      buttonHoverShadow: '0 6px 30px rgba(59, 130, 246, 0.35)',
      containerBg: '#1a1a1a',
      containerBorder: '#333333',
      headerBg: '#1a1a1a',
      headerBorder: '#333333',
      textColor: '#ffffff',
      textColorSecondary: '#a1a1aa',
      tooltipBg: 'rgba(255, 255, 255, 0.9)',
      tooltipColor: '#1a1a1a'
    };

    const theme = currentTheme === 'dark' ? darkTheme : lightTheme;

    return `
      .koala-chat-widget {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        direction: ltr;
      }

      .koala-floating-button {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: ${theme.buttonBg};
        border: none;
        box-shadow: ${theme.buttonShadow};
        z-index: 10000;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 24px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }

      .koala-floating-button::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: ${theme.buttonBg};
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: -1;
      }

      .koala-floating-button:hover {
        transform: translateY(-2px) scale(1.05);
        box-shadow: ${theme.buttonHoverShadow};
        background: ${theme.buttonHoverBg};
      }

      .koala-floating-button:hover::before {
        opacity: 1;
      }

      .koala-floating-button:active {
        transform: translateY(0) scale(1);
        transition: transform 0.1s ease;
      }

      .koala-floating-button img {
        width: 32px;
        height: 32px;
        object-fit: contain;
        border-radius: 50%;
      }

      /* 添加脉冲动画效果 */
      .koala-floating-button-pulse {
        animation: koala-pulse 2s infinite;
      }

      @keyframes koala-pulse {
        0% {
          box-shadow: ${theme.buttonShadow};
        }
        50% {
          box-shadow: ${theme.buttonHoverShadow};
        }
        100% {
          box-shadow: ${theme.buttonShadow};
        }
      }

      /* 新消息提示动画 */
      .koala-floating-button-notification {
        animation: koala-bounce 0.6s ease-in-out;
      }

      @keyframes koala-bounce {
        0%, 100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-10px);
        }
      }

      /* 自定义图标样式 - 移除背景，完全显示用户图标 */
      .koala-floating-button-custom-icon {
        background: none !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        padding: 0;
        overflow: hidden;
      }

      .koala-floating-button-custom-icon::before {
        display: none !important;
      }

      .koala-floating-button-custom-icon:hover {
        background: none !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        box-shadow: 0 6px 30px rgba(0, 0, 0, 0.25);
      }

      .koala-floating-button-custom-icon:hover::before {
        display: none !important;
      }

      .koala-floating-button-custom-icon img {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover;
        border-radius: 50%;
      }

      .koala-chat-container {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 550px;
        height: 700px;
        background: ${theme.containerBg};
        border-radius: 16px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        z-index: 10001;
        display: none;
        flex-direction: column;
        overflow: hidden;
        border: 1px solid ${theme.containerBorder};
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
      }

      .koala-chat-container.visible {
        display: flex;
        animation: koala-slide-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      @keyframes koala-slide-in {
        from {
          opacity: 0;
          transform: translateY(20px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .koala-chat-container.minimized {
        height: 60px;
        border-radius: 30px;
      }

      .koala-chat-container.maximized {
        width: 550px;
        height: 100vh;
        bottom: 0;
        right: 0;
        top: 0;
        border-radius: 0;
      }

      .koala-chat-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid ${theme.headerBorder};
        background: ${theme.headerBg};
        min-height: 60px;
      }

      .koala-header-title {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
        font-size: 16px;
        font-weight: 600;
        margin: 0;
        color: ${theme.textColor};
      }

      .koala-header-actions {
        display: flex;
        gap: 8px;
      }

      .koala-header-btn {
        width: 32px;
        height: 32px;
        border: none;
        background: none;
        cursor: pointer;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: ${theme.textColorSecondary};
        transition: all 0.2s ease;
        font-size: 16px;
      }

      .koala-header-btn:hover {
        background-color: ${currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'};
        color: ${theme.textColor};
        transform: scale(1.1);
      }

      .koala-chat-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        background: ${theme.containerBg};
      }

      .koala-empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        padding: 24px;
        text-align: center;
        color: ${theme.textColorSecondary};
      }

      .koala-empty-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }

      .koala-empty-title {
        font-size: 18px;
        margin-bottom: 8px;
        color: ${theme.textColor};
        font-weight: 500;
      }

      .koala-empty-description {
        font-size: 14px;
        line-height: 1.6;
        color: ${theme.textColorSecondary};
      }

      .koala-iframe-container {
        flex: 1;
        border: none;
        width: 100%;
        height: 100%;
        background: ${theme.containerBg};
      }

      .koala-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        color: ${theme.textColorSecondary};
      }

      .koala-error {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 20px;
        color: #ff4d4f;
        text-align: center;
      }

      .koala-error-title {
        font-weight: 500;
        margin-bottom: 8px;
      }

      .koala-error-description {
        font-size: 14px;
        color: ${theme.textColorSecondary};
      }

      .koala-tooltip {
        position: fixed;
        background: ${theme.tooltipBg};
        color: ${theme.tooltipColor};
        padding: 12px 16px;
        border-radius: 12px;
        font-size: 14px;
        white-space: nowrap;
        z-index: 10002;
        opacity: 0;
        transform: translateY(10px);
        transition: opacity 0.3s ease, transform 0.3s ease;
        pointer-events: none;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      }

      .koala-tooltip.visible {
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
      }

      .koala-tooltip::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 8px solid transparent;
        border-top-color: ${theme.tooltipBg};
      }

      @media (max-width: 768px) {
        .koala-chat-container {
          bottom: 0;
          right: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 0;
        }

        .koala-chat-container.maximized {
          width: 100%;
          height: 100%;
        }

        .koala-floating-button {
          bottom: 20px;
          right: 20px;
          width: 56px;
          height: 56px;
        }

        .koala-tooltip {
          bottom: 84px;
          right: 20px;
          max-width: calc(100vw - 40px);
          white-space: pre-wrap;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .koala-floating-button {
          transition: none;
        }
        
        .koala-floating-button:hover {
          transform: none;
        }
        
        .koala-chat-container.visible {
          animation: none;
        }
      }
    `;
  }

  // 获取API URL的辅助函数
  function getApiUrl() {
    // 如果配置中有apiUrl，直接使用
    if (config.apiUrl) {
      return config.apiUrl;
    }

    // 尝试从脚本标签获取源域名
    const scriptElement = document.querySelector('script[src*="koala-chat-widget.js"]');
    if (scriptElement) {
      const scriptSrc = scriptElement.getAttribute('src');
      if (scriptSrc) {
        try {
          const url = new URL(scriptSrc, window.location.href);
          return url.origin;
        } catch (e) {
          console.warn('Unable to parse script source URL:', scriptSrc);
        }
      }
    }

    // 兜底使用当前页面域名
    return window.location.origin;
  }

  // 域名验证
  async function validateDomain() {
    if (!config.appId) {
      return { isValid: false, reason: 'AppId is required' };
    }

    try {
      const apiUrl = getApiUrl();
      const currentDomain = window.location.hostname;
      
      const response = await fetch(`${apiUrl}/api/AppConfig/validatedomain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appId: config.appId,
          domain: currentDomain
        })
      });

      if (!response.ok) {
        console.error('Domain validation request failed:', response.status);
        return { isValid: false, reason: 'ValidationRequestFailed' };
      }

      const {data} = await response.json();
      return {
        isValid: data.isValid,
        reason: data.reason,
        appConfig: data.appConfig
      };
    } catch (error) {
      console.error('Domain validation error:', error);
      return { isValid: false, reason: 'NetworkError' };
    }
  }

  // 获取应用配置
  async function getAppConfig() {
    if (!config.appId) {
      return null;
    }

    try {
      const apiUrl = getApiUrl();
      
      const response = await fetch(`${apiUrl}/api/AppConfig/public/${config.appId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        console.error('Failed to get app config:', response.status);
        return null;
      }

      const appConfig = await response.json();
      return appConfig;
    } catch (error) {
      console.error('Failed to get app config:', error);
      return null;
    }
  }

  // 用户活动检测
  function updateUserActivity() {
    const now = Date.now();
    
    // 如果距离上次活动时间太短，避免频繁重置
    if (now - lastActivity < 1000) {
      return;
    }
    
    lastActivity = now;
    hideTooltip();
    
    // 重新开始计时
    if (config.enableTooltip && floatingButton && !isExpanded) {
      startTooltipTimer();
    }
  }

  // 开始提示计时器
  function startTooltipTimer() {
    clearTimeout(tooltipTimer);
    clearTimeout(tooltipHideTimer);
    
    // 检查是否需要等待更长时间（如果提示之前显示过）
    const now = Date.now();
    let delay = config.tooltipDelay;
    
    if (lastTooltipHideTime > 0) {
      const timeSinceHide = now - lastTooltipHideTime;
      if (timeSinceHide < config.tooltipRepeatDelay) {
        delay = config.tooltipRepeatDelay - timeSinceHide;
      }
    }
    
    tooltipTimer = setTimeout(() => {
      if (!isExpanded && floatingButton) {
        showTooltip();
      }
    }, delay);
  }

  // 显示提示
  function showTooltip() {
    if (!config.enableTooltip || !config.tooltipText || isExpanded) {
      return;
    }

    if (!tooltipElement) {
      createTooltip();
    }

    tooltipElement.textContent = config.tooltipText;
    tooltipElement.classList.add('visible');
    tooltipShown = true;

    // 设置自动隐藏计时器
    if (config.tooltipDuration > 0) {
      tooltipHideTimer = setTimeout(() => {
        hideTooltip();
      }, config.tooltipDuration);
    }
  }

  // 隐藏提示
  function hideTooltip() {
    if (tooltipElement) {
      tooltipElement.classList.remove('visible');
    }
    clearTimeout(tooltipHideTimer);
    lastTooltipHideTime = Date.now();
  }

  // 创建提示元素
  function createTooltip() {
    tooltipElement = document.createElement('div');
    tooltipElement.className = 'koala-tooltip';
    document.body.appendChild(tooltipElement);

    // 动态计算位置，确保提示出现在悬浮球上方
    function updateTooltipPosition() {
      if (floatingButton && tooltipElement) {
        const buttonRect = floatingButton.getBoundingClientRect();
        const tooltipRect = tooltipElement.getBoundingClientRect();
        
        // 计算提示位置：悬浮球上方，水平居中
        const tooltipBottom = window.innerHeight - buttonRect.top + 12; // 12px间距
        const tooltipRight = window.innerWidth - buttonRect.left - (buttonRect.width / 2) - (tooltipRect.width / 2);
        
        tooltipElement.style.bottom = tooltipBottom + 'px';
        tooltipElement.style.right = Math.max(12, tooltipRight) + 'px';
      }
    }

    // 点击提示时也打开聊天
    tooltipElement.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleChat();
    });

    // 监听窗口大小变化
    window.addEventListener('resize', updateTooltipPosition);
    
    // 初始位置更新
    requestAnimationFrame(updateTooltipPosition);
  }

  // 监听用户活动
  function initActivityListeners() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, updateUserActivity, {
        passive: true,
        capture: true
      });
    });
  }

  // 创建样式
  function createStyles() {
    // 初始化主题
    currentTheme = detectTheme();
    
    const styleElement = document.createElement('style');
    styleElement.id = 'koala-chat-widget-styles';
    styleElement.textContent = getThemeStyles();
    document.head.appendChild(styleElement);
  }

  // 创建悬浮球按钮
  function createFloatingButton() {
    const button = document.createElement('button');
    button.className = `koala-floating-button koala-floating-button-${currentTheme}`;
    button.title = '打开 AI 助手';
    
    if (config.expandIcon) {
      // 当用户提供了图标时，完全使用用户的图标
      button.classList.add('koala-floating-button-custom-icon');
      const img = document.createElement('img');
      img.src = `data:image/png;base64,${config.expandIcon}`;
      img.alt = 'AI 助手';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '50%';
      button.appendChild(img);
    } else {
      const baseUrl = getApiUrl();
      button.innerHTML = `<img src="${baseUrl}/logo.png" alt="AI 助手" style="width: 32px; height: 32px; object-fit: contain;">`;
    }

    button.addEventListener('click', toggleChat);
    return button;
  }

  // 创建聊天容器
  function createChatContainer() {
    const container = document.createElement('div');
    container.className = 'koala-chat-container';

    // 创建头部
    const header = document.createElement('div');
    header.className = 'koala-chat-header';

    const title = document.createElement('div');
    title.className = 'koala-header-title';
    title.innerHTML = `${config.title}`;

    const actions = document.createElement('div');
    actions.className = 'koala-header-actions';

    // 最小化按钮
    const minimizeBtn = document.createElement('button');
    minimizeBtn.className = 'koala-header-btn';
    minimizeBtn.innerHTML = '−';
    minimizeBtn.title = '最小化';
    minimizeBtn.addEventListener('click', minimizeChat);

    // 最大化按钮
    const maximizeBtn = document.createElement('button');
    maximizeBtn.className = 'koala-header-btn';
    maximizeBtn.innerHTML = '⛶';
    maximizeBtn.title = '最大化';
    maximizeBtn.addEventListener('click', toggleMaximize);

    // 关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.className = 'koala-header-btn';
    closeBtn.title = '关闭';
    
    if (config.closeIcon) {
      const img = document.createElement('img');
      img.src = `data:image/png;base64,${config.closeIcon}`;
      img.alt = '关闭';
      img.style.width = '14px';
      img.style.height = '14px';
      closeBtn.appendChild(img);
    } else {
      closeBtn.innerHTML = '×';
    }
    
    closeBtn.addEventListener('click', closeChat);

    actions.appendChild(minimizeBtn);
    actions.appendChild(maximizeBtn);
    actions.appendChild(closeBtn);

    header.appendChild(title);
    header.appendChild(actions);

    // 创建内容区域
    const content = document.createElement('div');
    content.className = 'koala-chat-content';

    // 初始显示加载状态
    showLoading(content);

    container.appendChild(header);
    container.appendChild(content);

    return container;
  }

  // 显示加载状态
  function showLoading(container) {
    container.innerHTML = `
      <div class="koala-loading">
        <div>正在加载 AI 助手...</div>
      </div>
    `;
  }

  // 显示错误状态
  function showError(container, message) {
    container.innerHTML = `
      <div class="koala-error">
        <div class="koala-error-title">加载失败</div>
        <div class="koala-error-description">${message}</div>
      </div>
    `;
  }

  function showIframe(container, iframe) {
    container.innerHTML = '';
    container.appendChild(iframe);
  }

  // 加载聊天界面
  function loadChatInterface(container) {
    // 检查必要配置
    if (!config.organizationName || !config.repositoryName) {
      showError(container, '应用配置缺失，无法加载聊天界面');
      return;
    }

    // 获取API URL用于构建聊天界面URL
    const baseUrl = getApiUrl();

    // 构建聊天界面 URL
    const params = new URLSearchParams({
      appId: config.appId,
      organizationName: config.organizationName,
      repositoryName: config.repositoryName,
      title: config.title,
      theme: config.theme,
      embedded: 'true'
    });

    if (config.expandIcon) {
      params.set('expandIcon', config.expandIcon);
    }
    if (config.closeIcon) {
      params.set('closeIcon', config.closeIcon);
    }

    const chatUrl = `${baseUrl}/chat/embedded?${params.toString()}`;

    // 创建 iframe
    const iframe = document.createElement('iframe');
    iframe.src = chatUrl;
    iframe.className = 'koala-iframe-container';
    iframe.frameBorder = '0';
    iframe.allowTransparency = true;

    // 直接插入iframe到容器中
    container.innerHTML = '';
    container.appendChild(iframe);

    showIframe(container, iframe);
  }

  // 全局变量
  let floatingButton = null;
  let chatContainer = null;
  let isExpanded = false;
  let isMinimized = false;
  let isMaximized = false;

  // 切换聊天窗口
  async function toggleChat() {
    const validation = await validateDomain();
    if (!validation.isValid) {
      alert(`域名验证失败: ${validation.reason || '当前域名未被授权使用此功能'}`);
      return;
    }

    // 更新配置（如果从验证结果中获取到了应用配置）
    if (validation.appConfig) {
      config.organizationName = validation.appConfig.organizationName;
      config.repositoryName = validation.appConfig.repositoryName;
      config.title = validation.appConfig.name || config.title;
    }

    if (isExpanded) {
      closeChat();
    } else {
      openChat();
    }
  }

  // 打开聊天窗口
  async function openChat() {
    // 隐藏提示
    hideTooltip();
    
    if (!chatContainer) {
      chatContainer = createChatContainer();
      document.body.appendChild(chatContainer);
      
      // 如果没有从验证中获取到配置，尝试单独获取
      if (!config.organizationName || !config.repositoryName) {
        const appConfig = await getAppConfig();
        if (appConfig) {
          config.organizationName = appConfig.organizationName;
          config.repositoryName = appConfig.repositoryName;
          config.title = appConfig.name || config.title;
        }
      }
      
      loadChatInterface(chatContainer.querySelector('.koala-chat-content'));
    }

    chatContainer.classList.add('visible');
    floatingButton.style.display = 'none';
    isExpanded = true;
    isMinimized = false;
  }

  // 关闭聊天窗口
  function closeChat() {
    if (chatContainer) {
      chatContainer.classList.remove('visible');
      chatContainer.classList.remove('minimized');
      chatContainer.classList.remove('maximized');
    }
    floatingButton.style.display = 'flex';
    isExpanded = false;
    isMinimized = false;
    isMaximized = false;
    
    // 重新开始提示计时器
    if (config.enableTooltip) {
      startTooltipTimer();
    }
  }

  // 最小化聊天窗口
  function minimizeChat() {
    if (chatContainer) {
      const minimizeBtn = chatContainer.querySelector('.koala-header-btn');
      
      if (isMinimized) {
        // 如果已经最小化，恢复正常大小
        chatContainer.classList.remove('minimized');
        isMinimized = false;
        // 更新按钮状态
        if (minimizeBtn) {
          minimizeBtn.innerHTML = '−';
          minimizeBtn.title = '最小化';
        }
      } else {
        // 最小化窗口
        chatContainer.classList.add('minimized');
        isMinimized = true;
        // 更新按钮状态
        if (minimizeBtn) {
          minimizeBtn.innerHTML = '▢';
          minimizeBtn.title = '恢复';
        }
      }
    }
  }

  // 切换最大化
  function toggleMaximize() {
    if (chatContainer) {
      if (isMaximized) {
        chatContainer.classList.remove('maximized');
        isMaximized = false;
      } else {
        chatContainer.classList.add('maximized');
        isMaximized = true;
      }
    }
  }

  // 初始化函数
  async function init(options = {}) {
    // 合并配置
    config = Object.assign(config, options);

    // 验证必要参数
    if (!config.appId) {
      console.error('KoalaChatWidget: appId is required');
      return;
    }

    // 获取应用配置
    try {
      const appConfig = await getAppConfig();
      if (appConfig) {
        config.organizationName = appConfig.organizationName;
        config.repositoryName = appConfig.repositoryName;
        config.title = appConfig.name || config.title;
        config.enableDomainValidation = appConfig.enableDomainValidation;
        config.allowedDomains = appConfig.allowedDomains || [];
      }
    } catch (error) {
      console.error('KoalaChatWidget: Failed to get app config:', error);
    }

    // 验证域名（如果启用了域名验证）
    if (config.enableDomainValidation) {
      const validation = await validateDomain();
      if (!validation.isValid) {
        console.error('KoalaChatWidget: Domain validation failed -', validation.reason);
        if (typeof config.onValidationFailed === 'function') {
          config.onValidationFailed(window.location.hostname);
        }
        return;
      }
    }

    // 等待 DOM 加载完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        setTimeout(initWidget, 100);
      });
    } else {
      setTimeout(initWidget, 100);
    }
  }

  // 初始化组件
  function initWidget() {
    try {
      // 初始化主题
      currentTheme = detectTheme();
      
      // 创建样式
      createStyles();

      // 创建悬浮球按钮
      floatingButton = createFloatingButton();
      document.body.appendChild(floatingButton);

      // 初始化主题监听
      initThemeListener();

      // 初始化用户活动检测
      initActivityListeners();

      // 启动提示计时器
      if (config.enableTooltip) {
        startTooltipTimer();
      }

      console.log('KoalaChatWidget initialized successfully');
    } catch (error) {
      console.error('KoalaChatWidget initialization failed:', error);
      if (typeof config.onError === 'function') {
        config.onError(error.message);
      }
    }
  }

  // 销毁组件
  function destroy() {
    // 清理计时器
    clearTimeout(tooltipTimer);
    clearTimeout(tooltipHideTimer);
    
    // 移除元素
    if (floatingButton) {
      floatingButton.remove();
      floatingButton = null;
    }
    if (chatContainer) {
      chatContainer.remove();
      chatContainer = null;
    }
    if (tooltipElement) {
      tooltipElement.remove();
      tooltipElement = null;
    }
    
    // 重置状态
    isExpanded = false;
    isMinimized = false;
    isMaximized = false;
    lastActivity = Date.now();
    tooltipShown = false;
    lastTooltipHideTime = 0;

    // 断开主题监听
    if (mediaQuery) {
      mediaQuery.removeEventListener('change', handleThemeChange);
    }
    if (themeObserver) {
      themeObserver.disconnect();
    }
  }

  // 添加新的公共方法以支持主题切换
  function setTheme(theme) {
    if (['light', 'dark', 'auto'].includes(theme)) {
      config.theme = theme;
      const newTheme = detectTheme();
      if (newTheme !== currentTheme) {
        currentTheme = newTheme;
        updateThemeStyles();
      }
    }
  }

  // 获取当前主题
  function getCurrentTheme() {
    return {
      configTheme: config.theme,
      currentTheme: currentTheme
    };
  }

  // 暴露全局 API
  window.KoalaChatWidget = {
    init: init,
    destroy: destroy,
    open: openChat,
    close: closeChat,
    toggle: toggleChat,
    setTheme: setTheme,
    getCurrentTheme: getCurrentTheme,
    version: '1.0.0'
  };

})(); 