# Cursor 阶段性开发 Prompt 指南

为了确保 Cursor 能够准确、完整地按照 `CrushOn_Chat_UI_Specs.md` 规范进行开发，请遵循以下分阶段的 Prompt 脚本。不要一次性让 Cursor 生成整个页面，而是按照从底层组件到顶层页面的顺序，逐步输入对应的 Prompt。

在使用这些 Prompt 之前，请确保你已经将 `.cursorrules` 文件放置在项目根目录。

---

## 阶段一：基础原子组件开发

在这一阶段，我们首先开发一些独立且复用率高的基础 UI 组件。

### Prompt 1: 标签与统计组件
```text
@CrushOn_Chat_UI_Specs.md

请阅读规范文档，帮我开发几个基础原子组件：
1. `TagChip.tsx`: 用于展示角色标签（如 Unfiltered, Corruption），支持点击展开。
2. `StatCounter.tsx`: 用于展示点赞数、收藏数等统计信息，包含图标和数字格式化（如 3.3M）。
3. `ModelBadge.tsx`: 用于展示模型等级徽章（Free 无徽章，Pro 蓝色，Ultra 紫色）。

要求：
- 使用 React (Next.js) + Tailwind CSS。
- 定义完整的 TypeScript 接口。
- 参考文档中第 1.2 节和 3.1 节的设计规范。
```

---

## 阶段二：核心消息渲染层

这是最关键的部分，涉及 AI 消息的 Markdown 渲染。

### Prompt 2: 消息气泡与 Markdown 渲染
```text
@CrushOn_Chat_UI_Specs.md 第 2.3 节

请严格按照文档中“消息渲染格式”的规范，开发 `ChatMessage.tsx` 组件。
要求：
1. 引入 `react-markdown` 和 `remark-gfm`。
2. 实现文档表格中定义的自定义渲染组件（Component Overrides）：
   - `em`：斜体叙事动作（text-gray-400 not-italic）
   - `strong`：粗体角色名称（text-white font-semibold）
   - `p`：段落间距（mb-3）
3. 实现思维泡泡的特殊处理：识别以 💭 开头的段落，并套用专门的 `ThoughtBubble` 样式容器（半透明背景、虚线边框）。
4. 区分用户消息（右侧对齐）和 AI 消息（左侧对齐，带头像）。
5. 提供一个完整的 Mock 数据示例，用于在 Storybook 或页面中预览渲染效果。
```

---

## 阶段三：输入与交互层

开发底部的聊天输入区域。

### Prompt 3: 底部输入区
```text
@CrushOn_Chat_UI_Specs.md 第 2.4 节

请开发聊天页面的底部输入区组件 `ChatInputArea.tsx`。
要求：
1. 包含一个支持多行文本输入的 `textarea`，能够随内容自动撑高（设定最大高度）。
2. 占位符提示为："Enter to send text. Alt/Shift+Enter for linebreak."。
3. 右下角包含发送按钮，输入内容后按钮高亮且可用。
4. 如果用户未登录状态（通过 props 传入），在输入区上方显示一个带有“Log In”按钮的醒目横幅提示。
5. 使用 Tailwind CSS 确保样式与深色模式沉浸式背景兼容。
```

---

## 阶段四：复杂设置面板（Composer 模式）

这一步涉及多个文件的协同，强烈建议使用 **Cursor Composer**（快捷键 `Cmd+I` / `Ctrl+I`）来生成。

### Prompt 4: Chat Setting 弹窗与状态管理
```text
@CrushOn_Chat_UI_Specs.md 第三节（Chat Setting 弹窗）

请使用 Composer 模式，同时生成以下文件，构建完整的聊天设置模块：
1. `store/chatSettingStore.ts`: 使用 Zustand 管理模型选择、温度、多样性、消息长度等状态。
2. `types/model.ts`: 根据文档 3.1 节，定义模型列表的 TypeScript 类型（包含 30 款模型、等级、速度等）。
3. `components/SliderParam.tsx`: 一个通用的滑块组件，用于调节温度（0~1）和消息长度（175~650）。
4. `components/ModelSelector.tsx`: 模型选择列表组件，支持滚动，选中项高亮，未解锁模型置灰。
5. `components/ChatSettingModal.tsx`: 组装上述组件的弹窗主体。

严格遵守文档中定义的参数范围和默认值。
```

---

## 阶段五：页面级组装

最后，将所有开发好的组件组合成完整的页面布局。

### Prompt 5: 聊天页面整体布局
```text
@CrushOn_Chat_UI_Specs.md 第二节（聊天页面）

请开发完整的聊天页面组件 `ChatPage.tsx`。
要求：
1. 采用左中右三栏响应式布局（参考 2.1 节表格）。
2. 背景使用角色立绘，并应用 `backdrop-filter: blur()` 实现沉浸式效果。
3. 左侧导航栏（默认折叠）。
4. 中间为主聊天区，引入之前写好的 `ChatMessage` 列表和 `ChatInputArea`。
5. 右侧功能面板，包含顶部角色信息、操作菜单（Start New Chat, Chat Setting），并支持通过 `>>` 按钮折叠。
6. 确保在移动端下，左右侧边栏默认隐藏，可通过汉堡菜单唤出。
```

### Prompt 6: 角色详情页
```text
@CrushOn_Chat_UI_Specs.md 第一节（角色详情页）

请开发角色详情页面 `CharacterDetailPage.tsx`。
要求：
1. 采用两栏/三栏响应式布局。
2. 左侧为固定面板（Sticky Sidebar），包含大尺寸立绘、操作按钮和创作者信息。
3. 右侧为主内容区，包含头部概览、"Start Chat" 渐变转化按钮、角色档案和场景设定。
4. 底部包含社区互动区（评论和 Public Memories）。
5. 组件划分清晰，尽量复用之前写好的 `TagChip` 和 `StatCounter` 组件。
```

---

## 验证与自检

在每个阶段生成代码后，可以使用以下 Prompt 让 Cursor 进行自我检查：

### 验证 Prompt
```text
@CrushOn_Chat_UI_Specs.md

请对比文档规范，检查刚才生成的代码：
1. 是否有遗漏文档中提到的特定功能或样式要求？
2. TypeScript 类型是否定义完整？
3. 是否存在未处理的边界情况（如未登录状态、VIP 权限限制）？
如果有，请列出遗漏项并提供修改建议。
```
