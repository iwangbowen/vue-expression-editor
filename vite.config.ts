import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const isDemo = mode === 'demo'

  return {
    base: '/vue-expression-editor/',
    plugins: [
      vue(),
      !isDemo && dts({
        include: ['src/**/*.ts', 'src/**/*.vue'],
        copyDtsFiles: true,
      })
    ].filter(Boolean),
    build: {
      outDir: isDemo ? 'demo-dist' : 'dist',
      cssCodeSplit: false, // 禁用 CSS 代码分割，将所有 CSS 打包到一个文件
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
            },
            assetFileNames: 'index.css' // 直接指定 CSS 文件名
          }
        }
      })
    }
  }
})
