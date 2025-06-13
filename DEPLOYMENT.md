# KoalaWiki 部署说明

## 📦 Release包说明

KoalaWiki提供了多平台的预编译二进制包，支持快速部署。

### 包含内容

- **后端程序包**: 包含自包含的.NET运行时，无需额外安装.NET环境
- **前端程序包**: 包含Next.js构建的静态文件和服务器

### 支持平台

- Windows x64
- Linux x64
- Linux ARM64 (适用于ARM服务器和树莓派等)
- macOS x64 (Intel Mac)
- macOS ARM64 (Apple Silicon Mac)

## 🚀 快速部署

### 1. 下载Release包

从GitHub Releases页面下载对应平台的包：

- `koala-wiki-backend-{platform}.{ext}` - 后端程序
- `koala-wiki-frontend.tar.gz` - 前端程序

### 2. 解压文件

```bash
# Linux/macOS
tar -xzf koala-wiki-backend-linux.tar.gz
tar -xzf koala-wiki-frontend.tar.gz

# Windows (使用PowerShell或解压工具)
Expand-Archive koala-wiki-backend-windows.zip
tar -xzf koala-wiki-frontend.tar.gz
```

### 3. 配置环境变量

编辑启动脚本中的环境变量：

#### 必需配置
- `CHAT_API_KEY`: AI模型的API密钥
- `CHAT_MODEL`: AI模型名称 (如: DeepSeek-V3, gpt-4等)
- `ENDPOINT`: AI服务端点 (如: https://api.openai.com/v1)
- `MODEL_PROVIDER`: 模型提供商 (OpenAI/AzureOpenAI/Anthropic/Bedrock)

#### 可选配置
- `DB_TYPE`: 数据库类型 (默认: sqlite)
- `DB_CONNECTION_STRING`: 数据库连接字符串
- `LANGUAGE`: 生成语言 (默认: 中文)
- `TASK_MAX_SIZE_PER_USER`: 每用户最大并行任务数
- `UPDATE_INTERVAL`: 仓库更新间隔(天)

### 4. 启动服务

#### Windows
```cmd
# 启动后端
start-backend.bat

# 启动前端 (新命令行窗口)
start-frontend.bat
```

#### Linux/macOS
```bash
# 启动后端
chmod +x start-backend.sh
./start-backend.sh &

# 启动前端
chmod +x start-frontend.sh  
./start-frontend.sh &
```

### 5. 访问应用

- 前端界面: http://localhost:3000
- 后端API: http://localhost:5085

## 🔧 高级配置

### 数据库配置

#### SQLite (默认)
```bash
DB_TYPE=sqlite
DB_CONNECTION_STRING="Data Source=./KoalaWiki.db"
```

#### PostgreSQL
```bash
DB_TYPE=postgresql
DB_CONNECTION_STRING="Host=localhost;Database=koalawiki;Username=user;Password=pass"
```

#### SQL Server
```bash
DB_TYPE=sqlserver
DB_CONNECTION_STRING="Server=localhost;Database=KoalaWiki;Trusted_Connection=true"
```

### 反向代理配置

#### Nginx示例
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 后端API
    location /api/ {
        proxy_pass http://localhost:5085;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Docker部署 (可选)

如果您更喜欢使用Docker，可以参考项目根目录的`docker-compose.yml`文件。

## 🛠️ 故障排除

### 常见问题

1. **端口占用**: 确保5085和3000端口未被占用
2. **权限问题**: Linux/macOS确保启动脚本有执行权限
3. **API密钥**: 确保AI服务的API密钥正确配置
4. **网络连接**: 确保能访问配置的AI服务端点

### 日志查看

- 后端日志: 查看控制台输出或日志文件
- 前端日志: 查看浏览器控制台

### 数据备份

重要数据位置：
- SQLite数据库: `KoalaWiki.db`
- 仓库文件: `/repositories` 目录
- 配置文件: 启动脚本中的环境变量

## 📞 技术支持

如遇到问题，请：

1. 查看项目文档
2. 检查GitHub Issues
3. 提交新的Issue并提供详细信息

## 🔄 更新升级

1. 备份数据库和配置
2. 下载新版本Release包
3. 停止旧服务
4. 替换程序文件
5. 启动新服务

---

更多详细信息请参考项目主页: https://github.com/AIDotNet/OpenDeepWiki 