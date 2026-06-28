# 测试方案

## 测试顺序

1. 文档审查：确认 UI/UX 范围、验收标准和部署方案明确。
2. 自动化测试：先补静态结构和部署配置检查，再改业务代码。
3. 本地验证：运行语法检查、静态测试和本地 HTTP 访问。
4. 发布验证：推送 GitHub 后检查 Actions 状态，再访问 `https://game.lich.tech/`。

## 自动化测试用例

### HTML 结构

- 页面必须存在 `#game-container`、`#start-screen`、`#top-bar`、`#ops-strip`、`#news-ticker`、`#game-canvas`、`#bottom-panel`。
- HUD 必须存在 `#wave-info`、`#money-display`、`#oil-ship-count`、`#rep-display`。
- 战况条必须存在 `#condition-display`、`#selected-display`、`#wave-progress`。
- 脚本加载顺序必须保持：`data.js`、`economy.js`、`projectile.js`、`enemy.js`、`tower.js`、`map.js`、`events.js`、`ui.js`、`game.js`。

### CSS 结构

- CSS 必须定义开始面板、HUD、战况条、底部按钮、禁用状态和竖屏旋转相关选择器。
- CSS 不应使用纯单色背景承载整个体验，应包含 Canvas 容器、HUD 和控件的分层样式。
- CSS 必须引用真实首屏背景图片资产。

### 图片资产

- 必须存在 `assets/hero-command.png` 和 `assets/battlefield-hormuz.png`。
- 必须存在 `assets/sprites/towers.png`、`assets/sprites/enemies.png`、`assets/sprites/projectiles.png`。
- 图片必须是 PNG 或 WebP 位图文件，不允许用 SVG 代替。
- 图片尺寸必须足够承担 UI 背景：首屏背景宽度至少 1200px，战场底图宽度至少 960px。
- HTML/CSS/JS 必须引用这些资产，防止图片生成后没有实际接入。
- spritesheet 必须带 alpha 通道，避免用矩形底色盖住战场背景。

### JS 语法

- `js/*.js` 必须全部通过 `node --check`。

### 交互静态检查

- `game.js` 必须包含统一坐标转换函数，避免 hover 和 click 逻辑重复且不一致。
- 水雷放置逻辑必须显式使用 `_lastHoverMineSlot` 创建 `Tower('mine', slot)`。
- UI 更新必须写入 `condition-display`、`selected-display`、`wave-progress`。
- `map.js` 必须预加载并绘制 `battlefield-hormuz.png`，且图片未加载时保留 Canvas 绘制兜底。
- `tower.js`、`enemy.js`、`projectile.js` 必须通过 sprite helper 绘制 PNG，而不是只用 Canvas 几何图形和 emoji。
- `data.js` 中塔位和航道坐标必须匹配文档中的背景坐标。

### Playwright 视觉验收

- 编码完成后启动本地 HTTP 服务。
- 用 Playwright 截取桌面视口 `1280x900` 的开始画面和开局后画面。
- 用 Playwright 截取移动视口 `390x844` 的旋转/适配画面。
- 截图必须能看到：真实首屏背景、真实战场底图、PNG 建筑、PNG 敌舰/弹头或其可触发初始状态。

### 部署配置

- 必须存在 `wrangler.toml`，且 `name = "game"`。
- 必须存在 `.github/workflows/deploy.yml`。
- workflow 必须在 `push` 到 `main` 时运行测试并执行 `wrangler deploy`。
- `.gitignore` 必须忽略 `.env`、`.env.local`、`.dev.vars`、`.wrangler`、`node_modules`。

## 手动验收

- 打开本地页面，开始画面视觉层次明显，主按钮清楚。
- 点击塔按钮后，战况条显示当前选中设施。
- 点击普通塔位可部署塔。
- 点击蓝色水雷槽位可部署水雷塔。
- 竖屏窄屏状态下，旋转后的点击位置与视觉位置一致。
- 推送后，`https://game.lich.tech/` 返回 HTTP 200，线上资源 hash 与本地部署产物一致。
