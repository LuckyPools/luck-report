module.exports = {
    root: true, // 停止在父级目录中寻找
    env: {
        es6: true, // 启用 ES6 语法支持以及新的 ES6 全局变量或类型
        node: true // Node.js 全局变量和 Node.js 作用域
    },
    extends: ['plugin:vue/essential'],
    rules: {
        'no-alert': 0, // 禁止使用alert confirm prompt
        'no-console': 0, // 禁止使用console
        'no-debugger': 0, // 禁止使用debugger
        'prefer-const': 0, // 建议使用 const 关闭
        'no-dupe-keys': 2, // 在创建对象字面量时不允许键重复 {a:1,a:1}
        'no-dupe-args': 2, // 函数参数不能重复
        'no-duplicate-imports': [
            1,
            {
                includeExports: true
            }
        ], // 不允许重复导入
        "no-unused-vars": "off", // 不允许变量未使用

        'no-duplicate-case': 2, // switch中的case标签不能重复
        'padded-blocks': 0, // 块语句内行首行尾是否要空行
        'space-after-keywords': [0, 'always'], // 关键字后面是否要空一格
        'space-before-blocks': [0, 'always'], // 不以新行开始的块{前面要不要有空格
        'space-before-function-paren': [0, 'always'], // 函数定义时括号前面要不要有空格
        'space-in-parens': [0, 'never'], // 小括号里面要不要有空格
        'space-infix-ops': 0, // 中缀操作符周围要不要有空格
        eqeqeq: 0, // 必须使用全等
        'no-var': 0, // 禁用var，用let和const代替
        'no-inline-comments': 0, // 禁止行内备注
        indent: 0,
        'vue/script-indent': 0,
        'vue/require-prop-type-constructor': 0,
        'vue/no-use-v-if-with-v-for': 0,
        "vue/no-v-model-argument": 0,
        'no-trailing-spaces': 0, // 一行结束后面不要有空格
        'no-multiple-empty-lines': 0, // [1, {"max": 2}],空行最多不能超过2行
        'no-extra-boolean-cast': 0, // 禁止不必要的bool转换
        'valid-jsdoc': 0,
        'one-var': 0, // 连续声明
        semi: 0, // 语句强制分号结尾
        'semi-spacing': [0, { before: false, after: true }], // 分号前后空格
        'no-new': 0, // 禁止在使用new构造一个实例后不赋值
        'no-extra-semi': 0, // 禁止多余的冒号
        'keyword-spacing': 0,
        'arrow-parens': 0, // 箭头函数用小括号括起来 - 关闭
        'generator-star-spacing': 0, // 生成器函数*的前后空格
        'no-mixed-operators': 0,
        'eol-last': 0, // 文件以单一的换行符结束 - 关闭
        'object-curly-spacing': 0, // 大括号内是否允许不必要的空格
        'no-callback-literal': 0,
        'multiline-ternary': 0
    },
    parserOptions: {
        parser: '@babel/eslint-parser',
        requireConfigFile: false
    },
    overrides: [
        {
            files: ['**/__tests__/*.{j,t}s?(x)', '**/tests/unit/**/*.spec.{j,t}s?(x)'],
            env: {
                jest: true
            }
        },
        {
            files: ['src/views/**/*.vue'],
            rules: {
                'vue/multi-word-component-names': 0,
            },
        }
    ]
};
