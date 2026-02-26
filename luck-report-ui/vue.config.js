const path = require('path');
const API_BASE_URL = process.env.VUE_APP_API_BASE_URL;
const port = process.env.port;
const PUBLIC_PATH = process.env.VUE_APP_PUBLIC_PATH || '/';

module.exports = {
  publicPath: PUBLIC_PATH,
  runtimeCompiler: true,
  devServer: {
    port: port,
    proxy: {
      '/api': {
        target: API_BASE_URL,
        pathRewrite: { '^/api': '/report' },
        ws: true,
        changeOrigin: true
      }
    },
    client:{
      // 关闭全屏报错提示
      overlay:false
    },
    // 配置静态资源路径
    static: {
      directory: path.resolve(__dirname, 'src/assets'),
      publicPath: '/assets',
      watch: true
    },
    // 启用历史模式的回退
    historyApiFallback: {
      rewrites: [
        // 将所有路径重定向到index.html，让前端路由处理
        { from: /.*/, to: path.join(PUBLIC_PATH, 'index.html') }
      ]
    },
    // 启用热模块替换
    hot: true
  },
  assetsDir: 'assets',
  // webpack配置
  configureWebpack: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      },
      fallback: {
        crypto: false,
        stream: require.resolve('stream-browserify')
      }
    }
  }
}

