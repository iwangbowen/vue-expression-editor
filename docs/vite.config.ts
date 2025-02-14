import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Vue Expression Editor',
  description: '功能强大的 Vue 3 数学表达式编辑器组件',
  base: '/vue-expression-editor/docs/',
  themeConfig: {
    nav: [
      { text: '指南', link: '/guide/' },
      { text: '示例', link: '/examples/' },
      { text: 'API', link: '/api/' },
      { text: '演示', link: 'https://iwangbowen.github.io/vue-expression-editor' }
    ],
    sidebar: {
      '/guide/': [
        {
          text: '指南',
          items: [
            { text: '介绍', link: '/guide/' },
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '基础配置', link: '/guide/basic-config' },
            { text: '主题定制', link: '/guide/theming' },
            { text: '变量管理', link: '/guide/variables' },
            { text: '表达式验证', link: '/guide/validation' },
            { text: '最佳实践', link: '/guide/best-practices' }
          ]
        }
      ],
      '/examples/': [
        {
          text: '示例',
          items: [
            { text: '基础用法', link: '/examples/' },
            { text: '变量操作', link: '/examples/variables' },
            { text: '主题切换', link: '/examples/themes' },
            { text: '布局设置', link: '/examples/layouts' },
            { text: '表达式验证', link: '/examples/validation' },
            { text: '高级用法', link: '/examples/advanced' }
          ]
        }
      ]
    }
  }
})
