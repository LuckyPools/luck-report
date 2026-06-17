/**
 *【window.localStorage 浏览器永久缓存】
 **/
export const local = {
    /**
     * 设置缓存
     * @param key
     * @param value
     * @param express
     */
    set(key, value, express) {
        localStorage.setItem(key, JSON.stringify({
            data: value,
            cTime: Date.now(),
            express: express
        }));
    },

    /**
     * 获取缓存
     * @param key
     * @returns {*|null}
     */
    get(key) {
        let item = localStorage.getItem(key);
        if (!item) {
            return null;
        }
        item = JSON.parse(item);
        let nowTime = Date.now();
        if (item.express && item.express < (nowTime - item.cTime)) {
            local.remove(key);
            return null;
        } else {
            return item.data;
        }
    },

    /**
     * 移除缓存
     * @param key
     */
    remove(key) {
        localStorage.removeItem(key);
    },

    /**
     * 移除全部永久缓存
     */
    clearAll() {
        localStorage.clear();
    }
}


/**
 *【window.sessionStorage 浏览器临时缓存】
 **/
export const session = {
    /**
     * 设置临时缓存
     * @param key
     * @param value
     */
    set(key, value) {
        window.sessionStorage.setItem(key, JSON.stringify(value));
    },

    /**
     * 获取临时缓存
     * @param key
     * @returns {any}
     */
    get(key) {
        let json = window.sessionStorage.getItem(key);
        return JSON.parse(json);
    },

    /**
     * 移除临时缓存
     * @param key
     */
    remove(key) {
        window.sessionStorage.removeItem(key);
    },

    /**
     * 移除全部临时缓存
     */
    clearAll() {
        window.sessionStorage.clear();
    },
}


export default {
    local,
    session
}
