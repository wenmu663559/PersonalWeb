# 击退笑声

尖刺击退触发 `game/src/naiwa-laugh.mp3`，单一音源循环播放，每次击退将停止时间延后到当前播放时钟的 3 秒之后。连续击退不重头播放、不叠音。遵守声音开关；静音、暂停、重开会中断播放。默认声音仍关闭，需要点击“声音：开”。

运行 Vite 5174 后执行 `node game/e2e/laugh.mjs` 验证最短播放、延长、暂停与静音。

# 缝隙贴墙修复

地面与角色取消接触摩擦，落地停止由平台顶部支撑判定负责。只有角色中心位于平台水平范围、脚底接近顶面时才执行落地制动，侧墙和边角不再清零下落速度。

回归测试：Vite 5174 启动后运行 `node game/e2e/gaps.mjs`，检查边角不制动、缝隙左右墙快速下落以及恢复后落地停止。

笑声音频候选来自 https://nai-hub.com/data/naiwa/voice.json ，标为“咳哈哈哈哈~”：https://nai-hub.com/assets/audio/nailong_laugh.mp3 。已下载到本地 artifacts/naiwa-laugh.mp3 供试听（15.65 秒），尚未接入游戏。

# 后退地形恢复修复

地形按角色前后各 2400 像素的窗口双向补齐，回收窗口外物理体和画面。退回已回收区域时按原编号重建相同刺群和起点旗；恢复角色位置后立即准备目标区域地形，再交给物理模拟。

回归：启动 `npm --prefix game run dev -- --port 5174` 后运行 `node game/e2e/backtrack.mjs`。测试直接设置远距离位置以覆盖回收边界，验证向后恢复、布局一致、内存段数上限和恢复后不循环掉落。

# 侧眼角色与连锁尖刺更新

用户选择图库候选 1（挺肚侧眼全身）。素材 `game/src/frog-sideeye.png` 由内置 image_gen 基于原图去背景、去留白，提示要求保留表情、全身姿态和比例；未使用旧大笑图。
来源：https://raw.githubusercontent.com/musemantic/NaiLoong/7f4b87fbb04b7cb8494b626f51a0808754dcf38e/assets/memes/naiwa_0075.jpg

起点设旗。初始安全区后为三根尖刺，后续每段五根，间隔 120 像素；向左上低角度击退，可碰到身后其他尖刺，每根独立冷却。掉坑后的恢复点不会将被击退角色送往前方。保留无限地形、落地停止与禁止旋转。

# 当前版本：无限模式

取消固定关卡与终点。前方按段生成地形，远处旧物理体与画面回收。落地即停、不旋转；尖刺向后弹退。距离最高分保存在 frog-endless-best，与旧通关成绩分离。

角色使用 game/src/frog-photo.png，以之前展示的新华手游奶蛙参考图编辑，去背景并补全被裁掉的脚。使用内置 image_gen；提示要求保留前景角色的脸、绿色眼睛、抱肚姿态和3D肤质，只移除背景、补齐脚部。来源：https://www.xinhuaedu.cn/zt/nwzcrkykcy/ 。这是参考图改编，非逐像素原图。

# 奶蛙弹跳大冒险

游戏源码在 `game/`，使用 Phaser 3 内置 Matter、TypeScript 和 Vite。角色素材随站点打包，无运行时外部素材下载。主页仅增加游戏入口，进入游戏页才加载 Phaser。

## 本地运行（Windows 11 / Node.js 22+）

```powershell
npm ci
npm ci --prefix game
npm start
```

主页：`http://localhost:3001/`，游戏：`http://localhost:3001/game/`。
单独开发游戏运行 `npm run game:dev`，使用 Vite 输出的地址。

鼠标左键 / Space / 触屏按住蓄力，松开向右上跳跃。必须稳定落地才能蓄力；粉色尖刺会击飞奶蛙，允许连续碰撞。掉坑回到最近检查点；无限向前推进。R 重开，Esc 暂停；移动端使用界面按钮。切出窗口会自动暂停。声音默认关闭，可手动开启。

最远距离、声音设置只存本机 localStorage，不需要账号或后端。

## 调整与验证

`game/src/physics.ts` 集中保存蓄力时间、角度、速度、重力、碰撞半径、尖刺力度上下限和冷却时间。`game/src/main.ts` 保存关卡布局和画面逻辑，形变仅改变渲染层，不修改物理碰撞体。

```powershell
npm test
npm run game:test
npm run build
```

浏览器验收使用独立无头 Edge（须已安装），先启动预览，再运行：

```powershell
$env:GAME_URL='http://127.0.0.1:3001/game/?debug=1'
node game/e2e/browser.mjs
```

`?debug=1` 提供只读 `window.__frog()` 快照，测试通过真实键鼠/触屏输入操作。截图输出到被 Git 忽略的 `artifacts/`。

## 静态部署与嵌入

`npm run build` 生成整站 `dist/`，其中 `dist/game/` 为游戏。Vite 使用相对资源路径，支持 GitHub Pages 的 `/PersonalWeb/` 项目路径；现有 Pages 工作流会安装游戏依赖并一起构建。推送并部署成功后游戏地址为：

`https://wenmu663559.github.io/PersonalWeb/game/`

独立游戏目录也可直接部署到任意静态托管。未来嵌入页面：

```html
<iframe src="./game/" title="奶蛙弹跳大冒险"
  style="width:100%;height:850px;border:0" loading="lazy"></iframe>
```

成绩以浏览器和站点来源为单位保存；清除浏览器数据会清除成绩。
