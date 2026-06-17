import request from '@/utils/request';

// 查询报表来源列表
export function loadReportProviders() {
  return request.get('/report/manage/loadReportProviders');
}

// 分页查询报表列表
export function queryReports(params) {
  return request.get('/report/manage/queryReports', { params });
}

// 删除报表
export function deleteReport(params) {
  return request.get('/report/manage/deleteReport', { params });
}
