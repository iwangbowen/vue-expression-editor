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
      })
    ].filter(Boolean),
    build: {
      outDir: isDemo ? 'demo-dist' : 'dist',
      cssCodeSplit: true,
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
            assetFileNames: (assetInfo) => {
              if (assetInfo.name === 'style.css') return 'index.css';
              return assetInfo.name;
            }
          }
        }
      })
    }
  }
})
