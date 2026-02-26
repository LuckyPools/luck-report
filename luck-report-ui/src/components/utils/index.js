
/**
 * @description 防抖函数
 * @param {Function} func 回调函数
 * @param {number} wait 防抖间隔
 * @param {string} name 计时器名称，计时器挂在到window上
 */
export function debounce(func, wait, name) {
    if (window[name]) clearTimeout(window[name]);
    window[name] = setTimeout(function() {
        func();
        window[name] = undefined;
    }, wait);
}

export function oneOf(value, validList) {
    for (let i = 0; i < validList.length; i++) {
        if (value === validList[i]) {
            return true;
        }
    }
    return false;
}

/**
 * @description 判断一个节点是否为VNode
 * @param {HTMLNode} node dom节点
 * @returns boolean
 */
export function isVNode(node) {
    return (
        node !== null &&
        typeof node === "object" &&
        hasOwnProperty.call(node, "componentOptions")
    );
}

export function findComponentUpward(context, componentName, componentNames) {
    if (typeof componentName === 'string') {
        componentNames = [componentName]
    } else {
        componentNames = componentName
    }

    let parent = context.$parent
    let name = parent.$options.name
    while (parent && (!name || componentNames.indexOf(name) < 0)) {
        parent = parent.$parent
        if (parent) name = parent.$options.name
    }
    return parent
}

/**
 * 寻找兄弟组件
 * @param context
 * @param componentName
 * @param exceptMe
 * @returns {Component[]}
 */
export function findBrothersComponents(context, componentName, exceptMe = true) {
    let res = context.$parent.$children.filter(item => {
        return item.$options.name === componentName
    })
    let index = res.findIndex(item => item._uid === context._uid)
    if (exceptMe) res.splice(index, 1)
    return res
}

/**
 * 向下查找组件
 * @param context
 * @param componentName
 * @returns {null}
 */
export function findComponentDownward(context, componentName) {
    const childrens = context.$children
    let children = null

    if (childrens.length) {
        for (const child of childrens) {
            const name = child.$options.name
            if (name === componentName) {
                children = child
                break
            } else {
                children = findComponentDownward(child, componentName)
                if (children) break
            }
        }
    }
    return children
}


/**
 * @description 对象深拷贝
 * @param {object} data 要拷贝的对象
 * @returns {object} 拷贝后的对象
 */
export function deepCopy(data) {
    const t = typeOf(data);
    let o;

    if (t === "array") {
        o = [];
    } else if (t === "object") {
        o = {};
    } else {
        return data;
    }

    if (t === "array") {
        for (let i = 0; i < data.length; i++) {
            o.push(deepCopy(data[i]));
        }
    } else if (t === "object") {
        for (let i in data) {
            o[i] = deepCopy(data[i]);
        }
    }
    return o;
}

/**
 * @description 类型判断
 * @param {*} obj 变量
 * @returns {string} 类型
 */
function typeOf(obj) {
    const toString = Object.prototype.toString;
    const map = {
        "[object Boolean]": "boolean",
        "[object Number]": "number",
        "[object String]": "string",
        "[object Function]": "function",
        "[object Array]": "array",
        "[object Date]": "date",
        "[object RegExp]": "regExp",
        "[object Undefined]": "undefined",
        "[object Null]": "null",
        "[object Object]": "object"
    };
    return map[toString.call(obj)];
}

