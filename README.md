# Hara-Projectie

![image](/docs/snapshot/image1.png)

这是一个主要针对项目跟踪以及任务管理开发的平台 ^^

技术栈介绍：
+ **前端**使用 `Next.js` + `Typescript` + `ShadcnUI` + `TailwindCSS` 构建界面
+ **后端**依赖 `Appwrite` 提供服务，采用 `Hono.js` 作为前后端通信框架构建后端接口。

## 实现功能

+ 🏢 多层级管理工作区、项目以及任务三个模块
+ 🗃️ 任务数据表视图，使用 `@tanstack/react-table` 完成
+ 📅 任务日历视图，使用 `react-big-calendar` + `date-fns` 完成
+ 📝 任务看板视图，使用 `@hello-pangea/dnd` 完成
+ ✨ 看板卡片支持拖拽排序更新任务状态
+ 📊 统计并展示当月与上个月的任务完成情况
+ 🚟 支持条件过滤任务数据表筛选需要查询的任务
+ 🎨 `TailwindCSS` + `ShadcnUI` 设计界面
+ 🪪 管理工作区内的用户角色权限
+ 📃 通过自动生成的邀请码加入多人工作区处理事务
+ 📱 加入响应式设计，对移动端用户
+ 📦 集成 `Appwrite` 提供的用户认证服务，支持谷歌或 Github 第三方平台登录
+ 📡 使用 `Hono.js` 作为前后端通信框架，编写 API 实现前后端数据交互

## 如何使用

### 克隆项目

```bash
git clone https://github.com/Tsukishima1/hara-projectie.git
```

### 安装依赖

```bash
npm install
```

### 配置环境变量

在项目根目录下创建 `.env.local` 文件，添加以下内容：

```ts
// 项目部署地址
NEXT_PUBLIC_APP_URL=

// 以下三个变量为 Appwrite 服务端配置
NEXT_APPWRITE_KEY= 
NEXT_PUBLIC_APPWRITE_ENDPOINT= 
NEXT_PUBLIC_APPWRITE_PROJECT= 

// 以下变量为 Appwrite 数据库 ID
NEXT_PUBLIC_APPWRITE_DATABASE_ID=
NEXT_PUBLIC_APPWRITE_WORKSPACES_ID=
NEXT_PUBLIC_APPWRITE_MEMBERS_ID=
NEXT_PUBLIC_APPWRITE_PROJECTS_ID=
NEXT_PUBLIC_APPWRITE_TASKS_ID=
NEXT_PUBLIC_APPWRITE_IMAGES_BUCKET_ID=
```

### 启动项目

```bash
npm run dev
```