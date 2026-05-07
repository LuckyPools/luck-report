const path = require('path');
const API_BASE_URL = process.env.VUE_APP_API_BASE_URL;
const port = process.env.port;
const PUBLIC_PATH = process.env.VUE_APP_PUBLIC_PATH || '/';

const isLibBuild = process.env.BUILD_TYPE === 'lib';

module.exports = {
  publicPath: isLibBuild ? './' : PUBLIC_PATH,
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
    client: {
      overlay: false
    },
    static: {
      directory: path.resolve(__dirname, 'src/assets'),
      publicPath: '/assets',
      watch: true
    },
    historyApiFallback: {
      rewrites: [
        { from: /.*/, to: path.join(PUBLIC_PATH, 'index.html') }
      ]
    },
    hot: true
  },
  assetsDir: 'assets',
  configureWebpack: isLibBuild ? {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      },
      fallback: {
        crypto: false,
        stream: require.resolve('stream-browserify')
      }
    },
    output: {
      libraryExport: 'default'
    }
  } : {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      },
      fallback: {
        crypto: false,
        stream: require.resolve('stream-browserify')
      }
    }
  },
  css: {
    extract: isLibBuild ? false : true,
    loaderOptions: {
      css: {
        // 忽略 CSS 顺序冲突警告
        esModule: false
      }
    }
  },
  chainWebpack: config => {
    if (!isLibBuild) {
      config.plugin('extract-css').tap(args => {
        args[0].ignoreOrder = true;
        return args;
      });
    }
  }
}

