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
 *     apiUrl: 'https://your-api-domain.com'
 *   });
 * </script>
 */

import { KoalaChatWidget } from "./widget";

// 创建全局实例
const chatWidget = new KoalaChatWidget();

// 暴露全局 API
window.KoalaChatWidget = {
  init: chatWidget.init.bind(chatWidget),
  destroy: chatWidget.destroy.bind(chatWidget),
  open: chatWidget.open.bind(chatWidget),
  close: chatWidget.close.bind(chatWidget),
  toggle: chatWidget.toggle.bind(chatWidget),
  version: chatWidget.version,
};
