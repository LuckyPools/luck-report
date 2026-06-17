import axios from 'axios';
import { getToken } from '@/utils/auth';

/**
 * 获取报表访问 token（使用原始 axios，绕过 dealAxiosResult 的 code: 200 判断）
 * @param data - { scope: 'designer'|'preview'|'manage', subject: 用户标识 }
 * @returns {Promise} 原始响应对象 { data: { code, data: { token, expiresIn, scope }, message, ok } }
 */
export function getReportToken(data) {
  // 使用原始 axios，不经过 dealAxiosResult 处理（该项目 code: 0 表示成功）
  const token = getToken();
  return axios.post('/api/report/auth/getToken', data, {
    headers: token ? { 'Authorization': 'Bearer ' + token } : {},
    timeout: 10000
  });
}

/**
 * 续期报表 token
 * @param data - { token: 旧token }
 * @returns {Promise} { token, expiresIn, scope }
 */
export function renewReportToken(data) {
  return request.post('/report/auth/renewToken', data);
}
