# Cloudflare 部署

页面与 Worker 已配置在 wrangler.jsonc，留言使用 D1。原来的 npm start 仍运行本地 Node 版本。

1. 在 Cloudflare 官网注册免费账号，运行 `npm run cf:login`，本人在浏览器中完成登录与授权。
2. 运行 `npx wrangler d1 create lijunwen-form-messages`，将返回的真实 database_id 加入 wrangler.jsonc 对应的 d1_databases 项。若数据库已创建，先用 `npx wrangler d1 list` 找到并复用它。
3. 运行 `npm run cf:migrate` 创建数据表。
4. 运行 `npm test` 和 `npm run cf:check`。
5. 运行 `npm run cf:deploy`，以命令返回的真实网址为准。
6. 检查线上首页、/api/content、作品弹窗与留言成功提示；在 D1 控制台验证留言已保存。

不需要付费计划；不要在聊天中提供密码或令牌。Cloudflare 免费资源额度仍有限制，国内网络可达性需要部署后实测。

本地 data/messages.jsonl 不会自动上传。云端留言存储于 D1 messages 表，没有公开读取接口；可通过已登录的 Cloudflare 控制台管理。contact_limits 使用每 10 分钟窗口的 IP 哈希键实现数据库原子限流，每窗口允许 5 次有效格式提交。它不保存原始 IP，过期记录在成功提交时清理。

云端版本使用固定窗口限流，与本地 Node 版本的首次请求起计时略有差异。上线后应定期检查数据库配额和备份。
