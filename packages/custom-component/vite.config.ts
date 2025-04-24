import react from '@vitejs/plugin-react'
import { watch } from 'chokidar'
import { createReadStream, existsSync } from 'node:fs'
import { createServer } from 'node:http'
import { resolve } from 'path'
import { defineConfig } from 'vite'
import { WebSocketServer } from 'ws'

// 自定义组件开发服务器插件
function componentDevServer() {
  const port = 5174

  let wss = null
  let httpServer = null
  let watcher = null

  return {
    name: 'component-dev-server',

    configureServer() {
      // 创建HTTP服务器用于提供组件文件
      httpServer = createServer((req, res) => {
        console.log(`收到请求: ${req.url}`)

        // 特别处理 /custom-component.js 请求
        if (req.url === '/custom-component.js') {
          const filePath = resolve(__dirname, 'dist', 'index.mjs')

          if (existsSync(filePath)) {
            console.log(`提供组件文件: ${filePath}`)
            res.setHeader('Content-Type', 'application/javascript')
            res.setHeader('Access-Control-Allow-Origin', '*')

            // 传输文件
            const fileStream = createReadStream(filePath)
            fileStream.pipe(res)
          } else {
            console.error(`组件文件未找到: ${filePath}`)
            res.statusCode = 404
            res.end(`组件文件未找到: ${filePath}`)
          }
        } else {
          // 调试信息页面
          if (req.url === '/' || req.url === '/index.html') {
            res.setHeader('Content-Type', 'text/html')
            res.end(`
              <html>
                <head><title>自定义组件开发服务器</title></head>
                <body>
                  <h1>自定义组件开发服务器</h1>
                  <p>此服务器运行在端口 ${port}</p>
                  <p>组件URL: <a href="/custom-component.js">/custom-component.js</a></p>
                </body>
              </html>
            `)
          } else {
            res.statusCode = 404
            res.end('未找到')
          }
        }
      })

      // 创建WebSocket服务器用于热更新
      wss = new WebSocketServer({ server: httpServer })

      wss.on('connection', ws => {
        console.log('编辑器已连接到组件开发服务器')

        ws.on('error', console.error)
      })

      // 启动服务器
      httpServer.listen(port, () => {
        console.log(`组件开发服务器运行在 http://localhost:${port}`)
        console.log(`组件URL: http://localhost:${port}/custom-component.js`)
      })

      // 设置文件监听
      watcher = watch(resolve(__dirname, 'dist', '**/*.{js,mjs}'))

      watcher.on('change', path => {
        console.log(`检测到文件变化: ${path}`)

        // 通知所有客户端
        wss.clients.forEach(client => {
          if (client.readyState === 1) {
            // WebSocket.OPEN
            client.send(
              JSON.stringify({
                type: 'component-updated',
                data: { id: 'CustomComponent', path },
              }),
            )
          }
        })

        console.log('组件已更新，已通知编辑器刷新')
      })
    },

    closeBundle() {
      // 构建完成后清理
      if (watcher) {
        watcher.close()
      }

      if (httpServer) {
        httpServer.close()
      }
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    componentDevServer(), // 添加组件开发服务器插件
  ],
  define: {
    // 提供 process.env 的 polyfill
    'process.env': JSON.stringify({}),
    // 如果代码中使用了 process.env.NODE_ENV
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'EasyEditorCustomComponent',
      fileName: format => `index.${format === 'es' ? 'mjs' : 'js'}`,
    },
    rollupOptions: {
      // 注释掉或删除外部依赖配置，让React被打包进组件
      // external: ['react', 'react-dom', '@easy-editor/core'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          '@easy-editor/core': 'EasyEditorCore',
        },
      },
    },
  },
})
