# 3d-html

积木星球是一个面向心理旋转训练的浏览器小游戏。项目已从单文件 `index.html` 拆分为按职责管理的模块，方便继续维护、扩展和部署。

## 目录

- `index.html`: 只负责加载样式和入口脚本。
- `src/main.js`: 应用启动、主菜单、通用导航和导入导出。
- `src/core/`: 通用工具、持久化存储。
- `src/data/`: 默认物体和关卡数据。
- `src/i18n/`: 中英文界面文案。
- `src/render/`: Canvas 体素渲染、旋转和拖拽交互。
- `src/features/editor.js`: 物体编辑器和关卡/题目编辑器。
- `src/features/game.js`: 游戏流程、计时、判分和结果页。
- `src/styles/app.css`: 全站样式和响应式布局。

## 运行

这是一个纯静态项目，可以直接部署到 Vercel、GitHub Pages 或任意静态服务器。由于入口脚本使用 ES Modules，推荐通过本地静态服务器打开，而不是直接双击 HTML 文件。

```bash
npx serve .
```

## 数据兼容

本项目继续使用 `MR_GAME_DATA` 作为 localStorage 键，导入/导出的 JSON 仍保持 `{ objects, levels }` 结构。旧版单文件导出的数据可以继续导入。
