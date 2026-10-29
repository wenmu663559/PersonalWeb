# GitHub Pages + Giscus

当前前端使用静态 content.js，不再调用 /api。历史 Cloudflare / Node 后端保留用于参考，但不会进入发布目录。

运行 `npm run build` 生成 dist，再运行 `npm run preview:static`，打开 http://localhost:3001。修改作品与笔记请编辑根目录 content.js，然后重新构建。

部署需要一个属于你的公开网站仓库（建议 PersonalWeb），分支 main。仅推送源码和工作流，不推送 data、node_modules、.wrangler、.env 或任何凭据。仓库 Settings → Pages → Source 选择 GitHub Actions。推送后，pages.yml 会构建并发布 dist。实际访问地址以 Actions 部署输出为准。

Giscus 配置：
1. 在该仓库 Settings → General → Features 启用 Discussions。
2. 由账号本人访问 https://github.com/apps/giscus ，只授权这个网站仓库。
3. 在 https://giscus.app/zh-CN 输入该仓库，选择 Announcements 分类。
4. 将生成的真实 repo、repo-id、category、category-id 填入 public/giscus-config.js，再推送发布。

评论公开存储在 GitHub Discussions，可跨浏览器、跨访客读取；不需要站长维护留言后端。未配置时页面会明确显示配置中，不会假装发送成功。不能从父页面直接设置 Giscus 内部分页为任意 N，也不会自动删除第 N 条以外的评论；按 Giscus 自带分页显示和管理。

当前未完成 GitHub 登录、仓库创建与 Giscus 安装授权，因此静态构建成功不等于上线成功。GitHub Pages / Giscus 在中国大陆的可达性需上线后实测。
