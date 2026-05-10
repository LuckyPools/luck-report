import request from "@/utils/request";

/**
 * 构建查询字符串
 * @param {Object} params 参数对象
 * @returns {string} 查询字符串
 */
function buildQueryString(params) {
    if (!params || typeof params !== 'object') {
        return '';
    }

    const pairs = [];
    for (const key in params) {
        if (params.hasOwnProperty(key) && params[key] !== undefined && params[key] !== null) {
            pairs.push(key + '=' + params[key]);
        }
    }

    return pairs.join('&');
}

/**
 * 预览报表数据
 * @param params 查询参数
 * @returns {Promise<Object>} 包含报表预览数据的Promise对象
 */
export async function loadHtml(params) {
    return request.get('/html/loadHtml', { params });
}

/**
 * 加载打印页面数据
 * @param formData 查询参数
 * @returns {Promise<Object>} 包含打印页面数据的Promise对象
 */
export async function loadPrintPages(formData) {
    return request.post('/html/loadPrintPages', formData, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });
}

/**
 * 加载页面纸张信息
 * @param formData 查询参数
 * @returns {Promise<Object>} 包含纸张信息的Promise对象
 */
export async function loadPagePaper(formData) {
    return request.post('/html/loadPagePaper', formData, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });
}

/**
 * PDF分页处理
 * @param formData 表单参数
 * @returns {Promise<Object>} 分页处理结果
 */
export async function pdfNewPaging(formData) {
    return request.post('/pdf/newPaging', formData, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });
}

/**
 * 获取PDF预览URL
 * @param params 查询参数
 * @param refreshIndex 刷新索引
 * @returns {string} PDF预览URL
 */
export function getPdfPreviewUrl(params, refreshIndex = 0) {
    const queryString = buildQueryString(params);
    const separator = queryString ? '&' : '';
    return `/api/pdf/show?${queryString}${separator}_r=${refreshIndex}`;
}

/**
 * 获取PDF直接打印URL
 * @param params 查询参数
 * @param index 打印索引
 * @returns {string} PDF打印URL
 */
export function getPdfDirectPrintUrl(params, index = 0) {
    const queryString = buildQueryString(params);
    const separator = queryString ? '&' : '';
    return `/api/pdf/show?${queryString}${separator}_i=${index}`;
}

/**
 * 获取导出PDF的URL
 * @param params 查询参数
 * @returns {string} 导出PDF的URL
 */
export function getPdfExportUrl(params) {
    const queryString = buildQueryString(params);
    return queryString ? `/api/pdf/build?${queryString}` : '/api/pdf/build';
}

/**
 * 获取导出Word的URL
 * @param params 查询参数
 * @returns {string} 导出Word的URL
 */
export function getWordExportUrl(params) {
    const queryString = buildQueryString(params);
    return queryString ? `/api/word/build?${queryString}` : '/api/word/build';
}

/**
 * 获取导出Excel的URL
 * @param params 查询参数
 * @returns {string} 导出Excel的URL
 */
export function getExcelExportUrl(params) {
    const queryString = buildQueryString(params);
    return queryString ? `/api/excel/build?${queryString}` : '/api/excel/preview';
}

/**
 * 获取分页导出Excel的URL
 * @param params 查询参数
 * @returns {string} 分页导出Excel的URL
 */
export function getExcelPagingExportUrl(params) {
    const queryString = buildQueryString(params);
    return queryString ? `/api/excel/paging?${queryString}` : '/api/excel/paging';
}

/**
 * 分页分Sheet导出Excel的URL
 * @param params 查询参数
 * @returns {string} 分页分Sheet导出Excel的URL
 */
export function getExcelSheetPagingExportUrl(params) {
    const queryString = buildQueryString(params);
    return queryString ? `/api/excel/sheet?${queryString}` : '/api/excel/sheet';
}

/**
 * 加载报表数据
 * @param params 查询参数
 * @returns {Promise<Object>} 包含报表数据的Promise对象
 */
export async function loadReportData(params) {
    const formData = new FormData();
    if (params) {
        for (const [key, value] of Object.entries(params)) {
            formData.append(key, value);
        }
    }
    return request.post('/html/loadData', formData, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });
}

/**
 * 存储图表数据
 * @param formData 包含图表数据的参数
 * @returns {Promise<Object>} 存储结果的Promise对象
 */
export async function storeChartData(formData) {
    return request.post('/chart/storeData', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
}
