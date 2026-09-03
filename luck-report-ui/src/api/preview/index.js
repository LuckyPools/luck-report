import request from "@/utils/request";
import {buildQueryString, downloadBlob} from "@/utils/comnon";


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
 * 导出PDF文件（Blob方式）
 * @param params 查询参数
 * @returns {Promise<void>}
 */
export async function exportPdfBlob(params) {
    return downloadBlob('/pdf/build', params, 'report.pdf');
}

/**
 * 导出Word文件（Blob方式）
 * @param params 查询参数
 * @returns {Promise<void>}
 */
export async function exportWordBlob(params) {
    return downloadBlob('/word/build', params, 'report.docx');
}

/**
 * 导出Excel文件（Blob方式）
 * @param params 查询参数
 * @returns {Promise<void>}
 */
export async function exportExcelBlob(params) {
    return downloadBlob('/excel/build', params, 'report.xlsx');
}

/**
 * 分页导出Excel文件（Blob方式）
 * @param params 查询参数
 * @returns {Promise<void>}
 */
export async function exportExcelPagingBlob(params) {
    return downloadBlob('/excel/paging', params, 'report.xlsx');
}

/**
 * 分页分Sheet导出Excel文件（Blob方式）
 * @param params 查询参数
 * @returns {Promise<void>}
 */
export async function exportExcelSheetPagingBlob(params) {
    return downloadBlob('/excel/sheet', params, 'report.xlsx');
}

/**
 * 获取PDF Blob URL（用于iframe预览）
 * @param params 查询参数（URL参数）
 * @param paperVo 纸张配置参数（可选，会进行URL编码）
 * @returns {Promise<string>} Blob URL
 */
export async function getPdfBlobUrl(params, paperVo = null) {
    const urlParams = { ...params };
    if (paperVo) {
        urlParams['_paper'] = encodeURIComponent(JSON.stringify(paperVo));
    }
    const queryString = buildQueryString(urlParams);
    const url = queryString ? `/pdf/show?${queryString}` : '/pdf/show';

    const response = await request.get(url, {
        responseType: 'blob'
    });

    const blob = response.data || response;
    return URL.createObjectURL(blob);
}

/**
 * 获取PDF Blob（用于直接打印）
 * @param params 查询参数（URL参数）
 * @param paperVo 纸张配置参数（可选，会进行URL编码）
 * @returns {Promise<{blobUrl: string, revoke: Function}>} Blob URL 和释放函数
 */
export async function getPdfPrintBlob(params, paperVo = null) {
    const urlParams = { ...params };
    if (paperVo) {
        urlParams['_paper'] = encodeURIComponent(JSON.stringify(paperVo));
    }
    const queryString = buildQueryString(urlParams);
    const url = queryString ? `/pdf/show?${queryString}` : '/pdf/show';

    const response = await request.get(url, {
        responseType: 'blob'
    });

    const blob = response.data || response;
    const blobUrl = URL.createObjectURL(blob);

    return {
        blobUrl,
        revoke: () => URL.revokeObjectURL(blobUrl)
    };
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

/**
 * 批量加载查询表单选项：按报表文件 + 数据集引用执行数据集，返回 label/value 选项
 * @param reportPath 报表文件路径，不可为空
 * @param mode 运行模式，可为空（preview 时从设计器预览缓存加载报表定义）
 * @param datasets 数据集引用列表，每项含 datasourceName/datasetName/labelField/valueField/parameters
 * @returns {Promise<Object>} options（key 为 "数据源名/数据集名"）+ errors（仅失败项存在）
 */
export async function loadSearchFormOptions(reportPath, mode, datasets) {
    return request.post('/html/loadSearchFormOptions', { reportPath, mode, datasets });
}
