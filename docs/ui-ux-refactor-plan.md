# 霍尔木兹狂想曲 UI/UX 重构方案

## 目标

把当前可玩的 Canvas 原型升级成更有完成度的战术指挥台体验，同时保留现有纯静态资源结构，确保推送到 GitHub 后可由 Cloudflare Worker `game` 自动部署。

## 范围

- 重构开始画面，使首屏具备游戏主题、局势信息和明确行动入口。
- 重构顶部 HUD，使波次、绿纸、油轮、声望更易扫描。
- 增加战况状态条，展示当前态势、波次进度和当前选中设施。
- 优化底部塔/主动出击按钮，提升移动端可点性和禁用状态可读性。
- 优化 Canvas 内反馈：放置预览、水雷槽位、塔位、波次进度提示。
- 修复影响体验的交互问题：水雷槽无法直接放置、竖屏旋转坐标映射错误。
- 增加 GitHub Actions 自动部署到 Cloudflare Worker `game`。

## 非目标

- 不引入前端框架或构建工具。
- 不重写核心战斗数值。
- 不迁移到 Cloudflare Pages。
- 不提交 `.env` 或任何 secret。

## 设计原则

- 第一屏直接是游戏入口，不做营销页。
- UI 应像“战术指挥台”，信息密度高但不压迫。
- 操作状态必须清楚：当前选了什么、哪里能放、钱够不够、波次处于什么阶段。
- 移动端优先保证可玩性，竖屏自动旋转后点击坐标必须准确。
- 颜色不做单一色调，主色为深海蓝、金色、警戒红、雷达绿混合使用。

## 验收标准

- `index.html` 首屏不再依赖内联段落样式，开始画面包含标题、状态摘要和主按钮。
- HUD 的 `wave-info`、`money-display`、`oil-ship-count`、`rep-display` 仍由 `updateUI()` 正常刷新。
- 新增的 `condition-display`、`selected-display`、`wave-progress` 在游戏运行中有实际状态更新。
- 选择水雷后点击蓝色水雷槽位可以部署水雷塔，并占用对应水雷槽。
- 未选择塔时点击空塔位仍可自动选择一个可负担设施。
- 竖屏旋转模式下，坐标映射使用实际 canvas 尺寸，不把 y 坐标映射到不可见的 `MAP.HEIGHT=600` 区域。
- 所有 JS 文件通过语法检查。
- 新增静态结构测试覆盖关键 DOM id、脚本加载顺序、CSS 选择器和部署配置。
- GitHub push 到 `main` 后触发 workflow，workflow 成功后部署 Worker `game`。

## 部署方案

项目不是 Cloudflare Pages，而是 Cloudflare Worker `game`。自动部署采用 GitHub Actions：

- 触发：push 到 `main`、手动 `workflow_dispatch`。
- 检查：Node 语法检查、静态结构测试。
- 部署：`wrangler deploy` 到 Worker `game`。
- 必需 GitHub Secrets：
  - `CLOUDFLARE_ACCOUNT_ID`
  - `CLOUDFLARE_API_TOKEN`

## 风险

- 当前仓库是 `/home/linux/TD/game`，外层 `/home/linux/TD` 也有 Git 仓库和 `.env`，后续提交必须固定在内层仓库。
- 当前 token 能部署 Worker，但查 zone routes/DNS 权限不足；自动部署不依赖 route 查询。
- GitHub Actions 首次运行可能因 secrets 未设置失败，需要先同步本地 `.env` 中的 secret 到 GitHub 仓库。
