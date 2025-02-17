import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'
import cssInjectedByJs from 'vite-plugin-css-injected-by-js'
import { version } from './package.json'

export default defineConfig(({ mode }) => {
  const isDemo = mode === 'demo'
  const isDev = mode === 'development'

  return {
    base: '/vue-expression-editor/',
    define: {
      // 开发环境显示 dev，演示模式显示实际版本号
      '__APP_VERSION__': JSON.stringify(isDev ? 'dev' : `v${version}`)
    },
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
