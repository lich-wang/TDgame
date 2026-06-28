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
- 建筑 spritesheet 必须包含半写实岸防设施和布雷艇帧，不允许只把水雷作为静态塔图标，也不允许继续使用上一版 flat/vector 程序绘制建筑。

### JS 语法

- `js/*.js` 必须全部通过 `node --check`。

### 交互静态检查

- `game.js` 必须包含统一坐标转换函数，避免 hover 和 click 逻辑重复且不一致。
- 水雷放置逻辑必须显式使用 `_lastHoverMineSlot` 创建布雷艇实体，而不是创建 `Tower('mine', slot)`。
- `game.js` 必须维护 `minelayers` 数组，并在 update/render/清理流程中处理布雷艇。
- `tower.js` 必须包含 `class Minelayer`，提供移动、布雷、受击、绘制和 `takeDamage()` 行为。
- `enemy.js` 必须包含敌方水面舰艇攻击布雷艇的逻辑，且空中单位不参与布雷艇攻击。
- UI 更新必须写入 `condition-display`、`selected-display`、`wave-progress`。
- `map.js` 必须预加载并绘制 `battlefield-hormuz.png`，且图片未加载时保留 Canvas 绘制兜底。
- `map.js` 在背景图加载成功的主要路径中不得保留粗 `laneGrad` 航道带、舰队方向箭头、旗帜和基地牌等额外绘制。
- `tower.js`、`enemy.js`、`projectile.js` 必须通过 sprite helper 绘制 PNG，而不是只用 Canvas 几何图形和 emoji。
- `data.js` 中塔位和航道坐标必须匹配文档中的背景坐标。
- `data.js` 中塔位必须使用 11 个背景平台坐标，不得保留旧的 8 个直线排布坐标。
- 静态测试必须解析 `towerSlotCoords`，检查塔位数量、关键坐标、非直线排布，以及所有塔位都位于 `MAP.WATER_TOP` 以上。
- 每个 `towerSlotCoords` 条目必须包含 `x/y/drawX/drawY/scale`，避免点击中心和建筑贴图锚点混用导致压水。
- `tower.js` 必须记录 `aimAngle`，攻击时更新目标方向，绘制时传入 sprite helper；布雷艇必须用实际移动向量 `headingAngle` 绘制。
- `assets.js` 必须包含 `projectileAngleOffsets`，让导弹/防空/炮弹按源图默认朝向修正后再旋转。
- `data.js` 中 `mine` 的展示名称必须是布雷艇，描述必须表达移动布雷。

### Playwright 视觉验收

- 编码完成后启动本地 HTTP 服务。
- 用 Playwright 截取桌面视口 `1280x900` 的开始画面和开局后画面。
- 用 Playwright 截取移动视口 `390x844` 的旋转/适配画面。
- 桌面战斗截图必须能看到：真实战场底图、低透明槽位提示、PNG 建筑、敌舰、移动中的布雷艇、水雷和敌舰攻击布雷艇的弹道/受击反馈。
- 截图中不得出现覆盖整条航道的粗彩色光带或大型箭头。

### 部署配置

- 必须存在 `wrangler.toml`，且 `name = "game"`。
- 必须存在 `.github/workflows/deploy.yml`。
- workflow 必须在 `push` 到 `main` 时运行测试并执行 `wrangler deploy`。
- `.gitignore` 必须忽略 `.env`、`.env.local`、`.dev.vars`、`.wrangler`、`node_modules`。

## 手动验收

- 打开本地页面，开始画面视觉层次明显，主按钮清楚。
- 点击塔按钮后，战况条显示当前选中设施。
- 点击普通塔位可部署塔。
- 点击蓝色水雷槽位可派出布雷艇；布雷艇会移动并持续投放水雷。
- 敌方水面舰艇靠近布雷艇时会攻击它；布雷艇被摧毁后槽位释放。
- 竖屏窄屏状态下，旋转后的点击位置与视觉位置一致。
- 推送后，`https://game.lich.tech/` 返回 HTTP 200，线上资源 hash 与本地部署产物一致。
