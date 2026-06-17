const {join} = require("path");
const unocss = require('@unocss/webpack').default;
const port = process.env.port || 80;
const API_BASE_URL = process.env.VUE_APP_API_BASE_URL;

module.exports = {
    runtimeCompiler: true,
    devServer: {
        port: port,
        proxy: {
            '/api': {
                target: API_BASE_URL,
                pathRewrite: { '^/api': '' },
                ws: true,
                changeOrigin: true
            },
        },
        client:{
            // 关闭全屏报错提示
            overlay:false
        }
    },
    configureWebpack: {
        plugins: [unocss()],
        optimization: {
            realContentHash: true,
        },
    },
    assetsDir: 'assets',
    css: {
        extract: true,
        sourceMap: true,
        loaderOptions: {
            less: {
                lessOptions: {
                    javascriptEnabled: true
                }
            }
        },
    },
    chainWebpack: config => {
        config.module
            .rule('svg')
            .exclude.add(join(__dirname, 'src/assets/icons/svg'))
            .end()

        config.module
            .rule('icons')// 定义一个名叫 icons 的规则
            .test(/\.svg$/)// 设置 icons 的匹配正则
            .include.add(join(__dirname,'src/assets/icons/svg'))// 设置当前规则的作用目录，只在当前目录下才执行当前规则
            .end()
            .use('svg-sprite')// 指定一个名叫 svg-sprite 的 loader 配置
            .loader('svg-sprite-loader')// 该配置使用 svg-sprite-loader 作为处理 loader
            .options({// 该 svg-sprite-loader 的配置
                symbolId:'icon-[name]'
            })
            .end()
    },
}

