import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'
import cssInjectedByJs from 'vite-plugin-css-injected-by-js' // 添加此行

export default defineConfig(({ mode }) => {
  const isDemo = mode === 'demo'

  return {
    base: '/vue-expression-editor/',
    plugins: [
      vue(),
      !isDemo && cssInjectedByJs(), // 自动注入 CSS 组件样式
      !isDemo && dts({
        include: ['src/**/*.ts', 'src/**/*.vue'],
        copyDtsFiles: true,
      })
    ].filter(Boolean),
    build: {
      outDir: isDemo ? 'demo-dist' : 'dist',
      cssCodeSplit: false, // 禁用 CSS 代码分割，将所有 CSS 内联
      ...(isDemo ? {
        // 演示页面构建配置
        rollupOptions: {
          input: {
            main: resolve(__dirname, 'index.html'),
          }
        }
      } : {
        // 库构建配置
        lib: {
          entry: resolve(__dirname, 'src/index.ts'),
          formats: ['es', 'cjs'],
          fileName: (format) => `index.${format === 'es' ? 'mjs' : 'js'}`
        },
        rollupOptions: {
          external: ['vue', 'element-plus'],
          output: {
            globals: {
              vue: 'Vue',
              'element-plus': 'ElementPlus'
            }
          }
        }
      })
    }
  }
})
