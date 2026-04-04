# CrushOn.AI 角色详情与聊天界面产品开发说明文档

本文档基于对 CrushOn.AI 角色详情页（`/character/:id/details`）和聊天页面（`/character/:id/chat`）的深度分析，为 Cursor 提供完整的产品功能说明、UI 布局规范、消息渲染格式以及模型调用选择系统的实现参考。在 HeyWaii Gameshub 的 AI 聊天模块开发中，可直接参照本规范进行组件设计和交互实现。

---

## 一、角色详情页（Character Detail Page）

角色详情页是用户了解 AI 角色设定、查看历史互动记录并决定是否开始聊天的核心转化页面。页面整体采用两栏或三栏响应式布局，左侧固定展示核心信息与操作，右侧为详细设定与社区互动内容。

### 1.1 左侧固定面板（Sticky Sidebar）

左侧面板在页面滚动时保持固定（`position: sticky`），确保核心转化按钮始终可见。顶部展示大尺寸角色立绘，推荐比例为 1:1，带有圆角和阴影效果。封面下方紧跟三个操作按钮，分别对应点赞（Like）、收藏（Bookmark）和分享（Share），每个按钮旁显示当前计数。

支持者模块（Supporters）展示近期支持该角色的用户头像列表（最多显示 5 个），并提供醒目的品牌色"Support Character"按钮。创作者信息（Creation Info）区块包含创作者头像、名称、Follow 按钮，同时展示粉丝数、总互动量等统计数据，并提供创作者的个人简介（支持展开/折叠）及社交媒体外链。

### 1.2 右侧主内容区（Main Content Area）

右侧区域提供角色的详细信息，分为头部概览、角色档案、图片指南和社区评论等模块。

**头部概览（Header Overview）**

头部包含角色名称大标题，以及展示总消息数、总字符数和创建时间的核心统计栏。主转化按钮为全宽、带有渐变色的"Start Chat"按钮，点击后跳转至聊天页面。下方提供横向滚动的图片画廊，展示角色相关的解锁图片（模糊预览 + 解锁提示）。

**标签与简介（Tags & Introduction）**

提供多维度的分类标签（如 Unfiltered、Corruption、Seductive、Step-family 等），支持展开查看全部标签，并提供一段简短的角色关键词摘要。

**角色档案（Character Profiles）**

详细列出角色的各项设定，包括姓名、年龄、与用户的关系、外貌描述、性格特征和背景故事。如果涉及多角色，会分别列出每个角色的档案，并明确定义用户（`{{user}}`）在当前场景中的身份。

**场景设定（The Situation）**

描述当前聊天的开场背景和具体情境，帮助用户快速代入。

**图片相册指南（Image Album Guide）**

说明聊天过程中可触发的特定图片类型及触发条件，通常以编号列表形式呈现（如 1: Handjob、2: Blowjob 等）。

### 1.3 社区互动区（Community Section）

社区互动区位于页面底部，旨在增强平台的用户粘性和活跃度。

评论区支持用户留言、点赞和嵌套回复。创作者的评论应带有特殊的"Creator"徽章以示区分。公开记忆（Public Memories）模块展示其他用户分享的优质聊天记录片段，分为热门（Hot）和最新（New）两个分类，卡片内包含消息数、参与角色和聊天内容摘要。

---

## 二、聊天页面（Chat Interface）

聊天页面是用户与 AI 角色互动的核心场景。页面布局需兼顾沉浸感与功能性，采用左中右三栏结构，侧边栏支持折叠。

### 2.1 整体布局结构

| 区域 | 宽度（桌面端） | 功能描述 |
|---|---|---|
| 左侧导航栏 | ~60px（折叠态）/ ~240px（展开态） | 全局导航 + 历史聊天列表 |
| 中间聊天区 | 自适应填充剩余空间 | 消息气泡流 + 底部输入区 |
| 右侧功能面板 | ~300px（展开态）/ 0（折叠态） | 角色信息、设置、记忆管理 |

### 2.2 聊天主视图（Chat Viewport）

聊天区域的背景通常为当前角色的立绘或场景图，采用高斯模糊（`backdrop-filter: blur()`）或降低透明度处理，以保证文字的可读性。

**消息气泡布局**

AI 消息左侧对齐，包含角色头像、名称和消息内容；用户消息右侧对齐，样式与 AI 消息区分。AI 回复中可穿插图片，图片应支持点击放大查看。进入聊天时的第一条开场白通常较长，详细描述当前场景和角色的初始动作，奠定聊天基调。

### 2.3 消息渲染格式（Message Rendering Format）

这是本系统最核心的渲染规范。CrushOn 的 AI 消息并非纯文本，而是一套混合了 **Markdown 语法 + 角色扮演约定格式** 的富文本渲染体系，必须使用支持 Markdown 的渲染库（如 `react-markdown` + `remark-gfm`）进行解析，并配合自定义 CSS 样式。

**格式规范总览**

| 格式类型 | Markdown 语法 | 渲染效果 | 用途 |
|---|---|---|---|
| 叙事动作 | `_斜体文本_` 或 `*斜体文本*` | 斜体，通常为灰色或浅色 | 描述角色的动作、场景变化、时间推进 |
| 角色对话 | `💜 **角色名**: "对话内容"` | 粗体名称 + 引号内容 | 角色说出的台词 |
| 内心独白 | `💭 **角色名's Thoughts**: _斜体内容_` | 粗体标签 + 斜体内容 | 角色的内心想法，以 💭 emoji 标识 |
| 强调文本 | `**粗体文本**` | 加粗 | 关键信息、角色名称 |
| 场景标题 | 普通段落文本 | 正常渲染 | 时间戳、地点描述等 |
| 换行分段 | 空行分隔 | 段落间距 | 分隔不同的叙事片段 |

**典型 AI 消息示例**

```markdown
_You've been living in this studio apartment in the city._

_9:15 PM._

_Clorinde stands up, heading to bathroom_

💜 **Clorinde**: "I'm going to shower first."

_She heads into the bathroom and closes the door._

💜 **Clorinde**: "What are you two looking at? We've only got this much space."

💭 **Clorinde's Thoughts**: _Let him decide. It's his studio apartment we're staying in._
```

**渲染实现要点**

在 React 中，推荐使用 `react-markdown` 配合自定义组件覆盖（component overrides）来实现上述格式。斜体（`em` 标签）应渲染为浅灰色叙事文字；粗体（`strong` 标签）应渲染为高亮的角色名称；段落（`p` 标签）之间保持适当的 `margin-bottom`，确保节奏感。

```tsx
// 示例：react-markdown 自定义渲染
<ReactMarkdown
  components={{
    em: ({ children }) => (
      <em className="text-gray-400 not-italic text-sm leading-relaxed">{children}</em>
    ),
    strong: ({ children }) => (
      <strong className="text-white font-semibold">{children}</strong>
    ),
    p: ({ children }) => (
      <p className="mb-3 leading-relaxed">{children}</p>
    ),
  }}
>
  {message.content}
</ReactMarkdown>
```

**思维泡泡（Thought Bubble）的特殊处理**

以 `💭` 开头的段落代表角色的内心独白，建议在前端识别后套用特殊样式容器（如半透明背景、虚线边框），以视觉上区分于普通对话。

### 2.4 底部输入区（Input Area）

底部输入框支持多行文本输入（`textarea`），占位符提示为"Enter to send text. Alt/Shift+Enter for linebreak."，发送按钮位于输入框右下角，输入内容后高亮可用。如果用户未登录，输入区上方会有醒目的横幅提示登录以保存聊天记录，并附带 Log In 按钮。

### 2.5 右侧功能面板（Right Panel）

右侧面板提供与当前聊天相关的设置和辅助功能，支持通过 `>>` 按钮折叠以扩大聊天区域。

**面板顶部信息区**

展示角色缩略图（横幅图）、角色名称、创作者链接、总互动量（3.3M 等），以及四个核心统计数字（点赞数、收藏数、评论数、分享数）和横向滚动的标签列表。

**操作菜单（Action Menu）**

| 菜单项 | 功能 |
|---|---|
| Start New Chat | 重置当前对话，开始新一轮聊天 |
| Chat Setting | 打开聊天偏好设置弹窗（详见第三节） |
| Character Detail | 跳转回角色详情页 |

**记忆管理（Memory Management）**

| 功能 | 说明 |
|---|---|
| Save Memory | 手动保存当前对话的关键节点为长期记忆 |
| View Memories | 查看已保存的所有记忆片段 |

**个性化（Personalization）**

| 功能 | 说明 |
|---|---|
| Customize Chat Page | 自定义聊天页面的背景、字体等视觉设置 |

**上下文摘要设置（Auto Summary）**

| 选项 | 权限要求 |
|---|---|
| No auto-summary | 免费 |
| Low frequency | 免费 |
| Medium frequency | Premium 会员 |
| High frequency | Elite 会员 |
| Re-Summarize（手动触发） | VIP 会员 |

摘要内容（Summarized Content）区域展示当前对话已生成的长期记忆摘要文本，帮助 LLM 在长对话中保持上下文一致性。

---

## 三、Chat Setting 弹窗（Chat Setting Modal）

Chat Setting 是聊天页面最核心的配置入口，通过右侧面板的"Chat Setting"按钮触发，以弹窗（Modal/Drawer）形式呈现。弹窗内包含五个主要设置模块。

### 3.1 模型选择（Model Selection）

这是整个系统最关键的功能之一。用户可以在此切换当前对话使用的底层 AI 模型，不同模型在角色扮演风格、响应速度和内容尺度上有显著差异。

**模型分级体系**

CrushOn 将所有模型分为三个访问等级，对应不同的会员权限和消耗规则：

| 等级 | 标识 | 访问权限 | 消耗规则 |
|---|---|---|---|
| Free | 无标识 | 所有用户免费使用 | 消耗月度 Message Credits |
| Pro | `Pro` 徽章（蓝色） | Standard 及以上会员 | 消耗 Credits；或购买 Pro Chat Package 后无限使用 |
| Ultra | `Ultra` 徽章（紫色） | Elite 及以上会员 | 消耗 Credits；需更高等级会员解锁 |

**当前可用模型完整列表（截至 2026 年 4 月）**

以下为 CrushOn.AI 平台当前在线的全部模型，按官方 Wiki 整理：

| 模型名称 | 等级 | 特点描述 |
|---|---|---|
| Crushon Leo | Free | 外向热情，擅长调情和无过滤内容 |
| Crushon Taurus | Free | 情感张力强，擅长无过滤内容 |
| Crushon Mochi | Free | 均衡稳定，不适合大胆创意 |
| Crushon Mochi V2 | Free | Mochi 升级版，格式化输出更佳 |
| Crushon Sagittarius | Free | 循序渐进构建对话，SFW/NSFW 均可 |
| GPT 4o Mini | Free | 逻辑推理强，结构化回复，偏 SFW |
| GPT 4.1 Mini | Free | Ultra GPT 4.1 的轻量版，响应快 |
| GLM 4.6 | Free | 创意扎实，角色一致性高，描述沉浸 |
| Gork3（Free Version） | Free | 环境和内心描写丰富细腻 |
| Stheno | Free | 擅长沉浸式故事创作，情节推进自然 |
| Deepseek | Free | 细腻委婉，擅长逐步推进剧情 |
| Magnum V4 72B | Free | 多功能，动作和内心描写生动丰富 |
| Mistral 24B | Free | 响应速度快，回复偏简洁 |
| Command R | Free | 想象力强，擅长丰富细节回复 |
| Command R+ | Free | Command R 升级版，多语言能力更强 |
| Pro Qwenna 3 | Pro | 清醒温柔，情感理解深刻 |
| Gemini 2.5 Flash | Pro | 语言理解和生成能力强，适合日常对话 |
| Ultra Claude 4 Sonnet | Ultra | 表达清晰，情感智能高，复杂对话推理强 |
| Ultra Claude 4.5 Sonnet | Ultra | 对话深度和创意大幅提升，故事叙述生动 |
| Ultra Claude Opus 4.5 | Ultra | 记忆和情境一致性卓越，高保真角色扮演 |
| Ultra Claude Opus 4.6 | Ultra | 创意卓越，描写丰富，逻辑严谨，角色扮演流畅 |
| Ultra Gemini 3 Flash | Ultra | 格式化输出改进，擅长渐进式情节发展 |
| Ultra Gemini 3.0 Pro | Ultra | 更深的共情能力，对话更真实生动 |
| Ultra Kimi K2 | Ultra | 氛围感强，细节丰富，叙事自然流畅 |
| Ultra GPT 5 | Ultra | 最先进的 GPT 模型，理解和创意顶尖 |
| Ultra GPT 4.1 | Ultra | 长对话连贯性更好，逻辑流更清晰 |
| Ultra Deepseek R1 | Ultra | 情感洞察自然，回复稍慢但处理更深入 |

**模型选择 UI 设计规范**

模型选择器以卡片列表形式呈现，每个模型卡片包含：模型名称、等级徽章（Free/Pro/Ultra）、响应速度指示器（如 `⚡1.6s`）、质量评分（如 `⭐2.65`）、一句话特点描述，以及"Change"切换按钮。当前选中的模型高亮显示，未解锁的模型显示为灰色并附带升级提示。

### 3.2 语言偏好（Language Preference）

用户可以选择 AI 角色回复所使用的语言，通过下拉选择器（`<select>`）实现。默认为 English，支持的语言因模型而异，部分模型不支持多语言。

### 3.3 聊天参数（Chat Parameters）

**温度（Temperature）**

控制角色回复的创意性和随机性，通过水平滑块（range slider）调节，范围为 0.0 ~ 1.0，默认值为 0.70。

| 值域 | 效果 |
|---|---|
| 接近 0（Rigid） | 回复更聚焦、可预测，角色行为更保守 |
| 接近 1（Creative） | 回复更多样、富有创意，但可能出现异常回复 |

> 注意：温度超过 1.0 可能导致回复质量下降，建议在 0.5 ~ 0.9 区间使用。

**内容多样性（Content Diversity）**

控制角色输出内容的多样化程度，通过水平滑块调节，范围为 0.0 ~ 1.0，默认值为 0.70。

| 值域 | 效果 |
|---|---|
| 接近 0（Repetitive） | 输出更重复、简洁 |
| 接近 1（Diverse） | 输出更多样化 |

> 注意：内容多样性超过 0.8 可能导致回复质量下降。

### 3.4 场景模式（Scenario-based Experience）

通过开关（Toggle）控制是否将角色的场景设定和示例对话纳入 LLM 上下文。开启后，角色会更严格地遵循详情页中定义的场景背景和人物设定。此功能为 VIP 专属功能。

### 3.5 最大 AI 消息长度（Max AI Message Length）

通过水平滑块控制 AI 每次回复的最大 token 数量，范围为 175 ~ 500 tokens（约 130 ~ 375 个英文单词）。此功能为 VIP 专属功能。不同会员等级对应的最大可设置长度不同：

| 会员等级 | 最大消息长度上限 |
|---|---|
| Free | 225 tokens（不可调整） |
| Standard | 275 tokens（不可调整） |
| Premium | 325 tokens（不可调整） |
| Luxe | 450 tokens（可调整） |
| Elite | 550 tokens（可调整） |
| Imperial | 650 tokens（可调整） |

---

## 四、会员等级与模型访问权限体系

CrushOn 的商业模式基于分级会员制，不同等级解锁不同的模型访问权限、记忆容量和功能特权。

| 会员等级 | 月费（年付） | Message Credits/月 | 可用模型等级 | 记忆容量 | 自动摘要频率 |
|---|---|---|---|---|---|
| Free | $0 | 100 | Free 模型 | 8K | 低频 |
| Standard | $4.9 | 2,000 | Free + Pro | 16K | 低频 |
| Premium | $7.9 | 6,000 | Free + Pro + Ultra | 16K | 中频 |
| Luxe | $25.0 | 20,000 | Free + Pro + Ultra | 16K | 中频 |
| Elite | $66.7 | 55,000 | Free + Pro + Ultra | 24K | 高频 |
| Imperial | $150.0 | 125,000 | Free + Pro + Ultra | 24K | 高频 |

此外，用户可以单独购买 **Pro Chat Package**（$24.99/月），获得对所有 Pro 模型的无限制无 Credit 消耗访问权限，可与任意会员等级叠加使用。

---

## 五、给 Cursor 的开发建议

在使用 Cursor 生成代码时，请遵循以下技术和设计建议。

### 5.1 组件化开发与响应式设计

将页面拆分为高度可复用的组件，例如将创作者信息卡片、角色档案区块以及消息气泡封装为独立的 React 或 Next.js 组件。使用 Tailwind CSS 的响应式断点实现多端适配。在移动端，详情页的左侧面板应变为顶部或底部悬浮，聊天页面的左右侧边栏应默认折叠，通过汉堡菜单唤出。

### 5.2 消息渲染实现

聊天消息必须使用 Markdown 渲染库处理，推荐 `react-markdown` + `remark-gfm`。需要为 `em`（斜体叙事）、`strong`（角色名称）、`p`（段落间距）分别定义自定义渲染组件。对于以 `💭` 开头的思维泡泡段落，建议在解析前通过正则预处理，为其套用特殊样式容器。

### 5.3 模型调用架构

后端 API 应设计为模型无关的统一接口，通过 `model_id` 参数路由至不同的 LLM 提供商（OpenAI、Anthropic、Google、Deepseek 等）。前端在发送消息时，将当前选中的模型 ID 随请求一并传递。模型切换不应重置当前对话的上下文历史，仅影响后续请求的路由目标。

```typescript
// 示例：统一的聊天 API 接口设计
interface ChatRequest {
  character_id: string;
  message: string;
  model_id: string;           // 如 "ultra-claude-4-sonnet"
  temperature: number;        // 0.0 ~ 1.0
  content_diversity: number;  // 0.0 ~ 1.0
  max_tokens: number;         // 175 ~ 650
  language: string;           // "en", "zh", "ja" 等
  include_scenario: boolean;  // 场景模式开关
  conversation_history: Message[];
  pinned_memory?: string;     // 已摘要的长期记忆文本
}
```

### 5.4 上下文记忆管理

为解决 LLM 上下文窗口限制问题，需实现三层记忆架构：

**短期记忆（Short-term Memory）** 为最近 N 条对话消息，直接传入 LLM 上下文，N 的上限由会员等级决定（200 ~ 1500 条）。

**摘要记忆（Summarized Memory）** 为超出短期记忆窗口的历史对话，通过定期调用 LLM 生成摘要，以压缩文本形式注入 System Prompt。摘要频率由用户在自动摘要设置中选择（无/低/中/高频）。

**固定记忆（Pinned Memory）** 为用户手动保存的关键节点，始终注入 System Prompt，不受窗口限制。固定记忆的字符上限因会员等级而异（4,000 ~ 8,000 字符）。

### 5.5 状态管理

聊天页面的消息列表、输入框状态、侧边栏折叠状态、当前选中模型和 Chat Setting 参数，建议使用 Zustand 或 React Context 进行全局状态管理，确保跨组件的数据同步。

### 5.6 视觉效果与内容安全

聊天界面的背景图使用 CSS 的 `backdrop-filter: blur()` 属性实现，配合深色半透明遮罩，提升沉浸感同时保证文字清晰。在实际开发中，必须严格遵守 UGC 内容审核规则，特别是涉及敏感图片时，应设置内容过滤阈值，并在前端提供年龄确认弹窗（18+ 确认）。
