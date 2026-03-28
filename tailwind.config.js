/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 背景色
        background: {
          DEFAULT: '#0F111A', // 最深的主背景色
          paper: '#1A1D27',   // 卡片/面板背景色
          elevated: '#252936', // 悬浮层/弹窗背景色
        },
        // 强调色 (霓虹感)
        primary: {
          DEFAULT: '#8B5CF6', // 紫色
          hover: '#A78BFA',
          glow: 'rgba(139, 92, 246, 0.5)',
        },
        secondary: {
          DEFAULT: '#EC4899', // 粉红色
          hover: '#F472B6',
        },
        accent: {
          DEFAULT: '#06B6D4', // 青色 (用于标签或次要高亮)
        },
        // 文本颜色
        text: {
          primary: '#F9FAFB', // 主标题/正文
          secondary: '#9CA3AF', // 次要文本/描述
          muted: '#6B7280',   // 禁用/极次要文本
        },
        // 状态色
        status: {
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#3B82F6',
        }
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
        'gradient-dark': 'linear-gradient(180deg, rgba(15,17,26,0) 0%, rgba(15,17,26,1) 100%)',
      }
    },
  },
  plugins: [],
}

