// Project descriptions grounded in public repository READMEs; reviewed 2026-10-28.
export const content = {
  "profile": {
    "name": "lijunwen",
    "role": "Computer science student",
    "location": "Sichuan, CN",
    "demo": false
  },
  "projects": [
    {
      "id": "orbit",
      "className": "orbit",
      "index": "01",
      "title": "龙娘桌宠 — 让桌面多一个陪伴",
      "category": "digital",
      "label": "DESKTOP APP / ELECTRON",
      "year": "v1.5.0",
      "description": "一款面向 Windows 10/11 x64 的透明桌宠。角色可以拖动、散步、看书和休息；离线动作无需密钥，AI 文字对话按需开启。",
      "stack": [
        "JavaScript",
        "Electron",
        "Windows",
        "safeStorage"
      ],
      "details": "为什么做\n把角色陪伴放进日常桌面，而不是另开一个需要持续关注的应用。透明背景、置顶和托盘恢复，让角色留在视线里，也给工作留出空间。\n\n交互怎样落地\n向左或向右散步会真实移动窗口，到工作区边缘停止；拖动、打开菜单或切换动作可中断散步。Ctrl + 滚轮调整大小，鼠标穿透时保留可操作的底部控制柄。\n\n对话与隐私\n可自行配置 OpenRouter API Key，代码固定使用 openrouter/free 路由。密钥通过 Electron safeStorage 在本机加密保存；近期聊天上下文仅保留在进程内存中。上游额度与可用性由服务提供方决定。\n\n体验与限制\n下载 Release 的 Windows x64 ZIP，完整解压后运行 DragonCompanion.exe。当前动画使用姿势图集和过渡，并非完整 Live2D；当前版本不包含随机乱逛。项目为非官方同人形象，与 OpenAI 无官方关联。代码与素材尚未授予开源许可证。",
      "url": "https://github.com/wenmu663559/GPT-2D-desktop-pet",
      "action": "查看源码与使用说明",
      "secondaryUrl": "https://github.com/wenmu663559/GPT-2D-desktop-pet/releases/tag/v1.5.0",
      "secondaryAction": "查看 Windows 版本"
    },
    {
      "id": "echo",
      "className": "echo",
      "index": "02",
      "title": "ADS-B — 预测尚未发生的接近交互",
      "category": "research",
      "label": "RESEARCH / REPRODUCIBILITY",
      "year": "PYTHON",
      "description": "根据此前两分钟的 ADS-B 观测，预测未来 30、120、300 秒新发生的接近交互数量及阈值超越概率。重点是目标定义、日期隔离验证，以及冻结方案的跨机场评估。",
      "stack": [
        "Python",
        "ADS-B",
        "时序预测",
        "跨机场验证"
      ],
      "details": "研究问题\n如果只看当前空域有多少飞机，能否预测接下来新出现的几何接近交互？这个项目将已发生与未来新发生的交互区分开，目标构造排除预测截点已活跃的配对。\n\n方法与验证\n表示阶梯依次比较聚合交通状态、观测配对几何和恒速 CPA 特征；使用源日期分块的确认评估，并将冻结方案应用到 KAGC，不针对新机场调参。另包含处理过度离散计数的 NB2 补充分析。\n\n可以复现什么\n仓库包含 6,008 个开发场景、2,605 个 KBTP 确认场景和 1,268 个 KAGC 外部场景。9.27 MiB 的压缩复现数据附有哈希、来源说明、保留的数据划分和执行命令；完整上游原始语料不在仓库中。\n\n如何阅读\n从 README 与 data/reproduction/ 开始，查看 configs/ 中的冻结协议、reports/references/ 中的结果文件，再阅读 src/airspace_complexity/ 和 scripts/ 的实现。仓库还提供论文与补充材料源文件。\n\n解释边界\n目标是 ADS-B 推导的几何筛查指标，不是经验证的管制员工作负荷、官方间隔丧失、碰撞概率或事故风险。论文文件不代表已投稿或已被期刊接收。项目暂无开源许可证，复用需取得作者许可。",
      "url": "https://github.com/wenmu663559/adsb-future-onset-interaction-forecasting",
      "action": "查看研究与复现说明"
    },
    {
      "id": "forma",
      "className": "forma",
      "index": "03",
      "title": "FORM — 这个网站，也是一件作品",
      "category": "experiment",
      "label": "WEB / CREATIVE CODING",
      "year": "2026",
      "description": "把个人主页做成一个可交互的作品：实时三维粒子雕塑、分类浏览、技术笔记与通过 GitHub 同步的公开留言。页面不依赖视频或外部动画素材。",
      "stack": [
        "Canvas 2D",
        "GitHub Pages",
        "响应式 CSS",
        "原生 JavaScript"
      ],
      "details": "视觉如何生成\n首屏以参数化环面生成点云，通过三维旋转、透视投影和深度排序，在二维 Canvas 中绘制立体雕塑。鼠标位置以平滑插值影响视角，时间驱动缓慢旋转。\n\n动效也有边界\n画布离开视口或页面进入后台时停止动画；尊重系统减少动态效果偏好，并提供手动暂停按钮。页面内容通过 IntersectionObserver 触发入场，不用持续监听每一次滚动。\n\n静态化如何工作\n页面内容由构建步骤输出为静态 JavaScript，浏览器无需调用自建数据接口。公开留言计划通过 Giscus 接入 GitHub Discussions，使用 GitHub 账号登录并同步评论。\n\n当前范围\n网站部署目标为 GitHub Pages；留言服务需要完成 Giscus 仓库授权后启用。评论公开可见，按组件自带分页展示，不收集联系邮箱，也不会自动发送邮件。"
    }
  ],
  "notes": [
    {
      "title": "桌宠的关键交互：穿透之后，怎样找回控制权？",
      "tag": "DESKTOP / ENGINEERING",
      "date": "项目解读",
      "text": "透明窗口并不等于不打扰。桌宠放在其他应用上方时，需要决定哪些鼠标操作由角色接收，哪些应该交给后面的窗口。\n\n项目提供鼠标穿透，同时保留底部控制柄。这样既能继续使用下方应用，也能重新打开菜单。散步同样需要清晰的退出路径：打开菜单、拖动或选择其他动作，都可以中断移动。\n\nAI 对话被做成可选能力。离线角色动作不依赖密钥；只有发送消息时，文字及近期上下文才提交给 OpenRouter 和实际模型提供方。本地密钥与临时对话上下文分别处理，避免把所有状态混在一起。\n\n这些设计说明来自公开仓库 README，是对现有实现的整理，并非用户体验实验结论。"
    },
    {
      "title": "预测“未来新发生”，为什么先要排除“现在已有”？",
      "tag": "RESEARCH / TARGET",
      "date": "项目解读",
      "text": "对预测任务而言，目标定义决定模型究竟学到了什么。把已经活跃的配对计入未来交互，可能让任务混合“已有状态延续”和“新交互出现”两类问题。\n\nADS-B 项目明确采用 future-onset 目标，排除预测截点已经活跃的配对。输入是前两分钟的观测，预测窗口为 30、120、300 秒。这样，任务关注的是尚未出现的几何接近交互。\n\n验证也分两层：KBTP 按源日期分块进行确认，再把冻结方案用于 KAGC 的跨机场评估。无机场特定调参这一约束，使外部评估与站点内开发保持区分。\n\n这里的接近交互是几何筛查指标，不能直接解释成事故风险、官方间隔违规或管制员工作负荷。说明依据公开仓库，不补充未经核实的性能数字。"
    },
    {
      "title": "让研究仓库不仅能读，也能重新运行",
      "tag": "REPRODUCIBILITY",
      "date": "仓库导读",
      "text": "只有代码，并不意味着一次实验可以复现。还需要明确输入数据、划分、配置、运行入口和结果对应关系。\n\n这个仓库把派生场景与标准化报告打包在 data/reproduction/paper-data-v1.zip 中，并提供清单、哈希、归属说明和重放命令。configs/ 保存冻结协议，reports/references/ 保存支持论文表图的机器可读结果。\n\n建议阅读顺序：先看 README 的研究范围，再看复现数据说明，随后检查环境锁定文件和主执行脚本，最后对照保留的结果文件。完整上游原始语料需从官方来源另行获取。\n\n仓库说明还保留了历史数据校验的限制。复现时应按对应配置阅读这些说明，不把某次测试通过理解为所有历史工件都已验证。"
    }
  ]
};
