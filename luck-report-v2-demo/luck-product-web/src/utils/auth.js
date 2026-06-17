import {CACHE_PREFIX, TOKEN_KEY} from "@/config/app";
import CryptoJS from 'crypto-js';

/**
 * 获取token
 * @returns {string}
 */
export function getToken() {
  const tokenKey = getLocalTokenKey();
  const token = localStorage.getItem(tokenKey);
  if (!token) {
    return sessionStorage.getItem(tokenKey);
  }
  return token;
}

/**
 * 设置token
 * @param token
 * @param remember
 */
export function setToken(token, remember) {
  removeToken();
  if (token) {
    const tokenKey = getLocalTokenKey();
    localStorage.setItem(tokenKey, token);
    if (remember) {
      sessionStorage.setItem(tokenKey, token);
    }
  }
}

/**
 * 移除 token
 */
export function removeToken() {
  const tokenKey = getLocalTokenKey();
  localStorage.removeItem(tokenKey);
  sessionStorage.removeItem(tokenKey);
}

/**
 * 获取 token 键
 * @returns {string}
 */
export function getLocalTokenKey(){
  return CACHE_PREFIX + ":" + TOKEN_KEY;
}

/**
 *  校验密码格式
 */
function validatePasswordFormat(password,target){
  // 密码必须满足：
  // - 至少8位长度
  // - 包含至少一个小写字母
  // - 包含至少一个大写字母
  // - 包含至少一个数字
  // - 包含至少一个特殊字符
  const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
  const result = passwordRegex.test(password);
  if (!result) {
    return '密码长度至少8位，包含数字，大小写字母和特殊字符';
  }
  return result
}


/**
 * 使用 SHA256 加密密码
 * @param password
 * @returns {*}
 */
export function encryptSHAPassword(password) {
  return CryptoJS.SHA256(password).toString();
}