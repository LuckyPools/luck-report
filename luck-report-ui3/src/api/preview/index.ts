/**
 * 报表预览相关 API
 *
 * 调用方：preview 视图、预览工具栏、PDF 打印对话框、图表工具等
 *
 * 后端统一响应结构：{ code, message, data }
 * utils/request.ts 已自动解包 ResultVO.data，这里直接拿到的是业务数据本身。
 */
import request from "@/utils/request";
import {buildQueryString, downloadBlob} from "@/utils/comnon";

/** 报表预览数据 */
export interface PreviewReportData {
  searchForm?: string
  content?: string
  style?: string
  reportAlign?: string
  totalPage?: number
  totalPageWithCol?: number
  pageIndex?: number
  chartDatas?: Array<{ id: string; json: string }>
  intervalRefreshValue?: number
}

/**
 * 预览报表数据
 * @param params 查询参数
 * @returns 包含报表预览数据
 */
export async function loadHtml(params: Record<string, any>): Promise<PreviewReportData> {
    return request.get<PreviewReportData>('/html/loadHtml', { params });
}

/**
 * 加载打印页面数据
 * @param formData 查询参数
 * @returns 包含打印页面 HTML 内容
 */
export async function loadPrintPages(formData: URLSearchParams): Promise<{ html: string }> {
    return request.post<{ html: string }>('/html/loadPrintPages', formData, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });
}

/**
 * 加载页面纸张信息
 * @param formData 查询参数
 * @returns 包含纸张信息
 */
export async function loadPagePaper(formData: URLSearchParams): Promise<any> {
    return request.post<any>('/html/loadPagePaper', formData, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });
}

/**
 * 导出PDF文件（Blob方式）
 * @param params 查询参数
 * @returns 触发文件下载的Promise对象
 */
export async function exportPdfBlob(params: Record<string, any>): Promise<void> {
    return downloadBlob('/pdf/build', params, 'report.pdf');
}

/**
 * 导出Word文件（Blob方式）
 * @param params 查询参数
 * @returns 触发文件下载的Promise对象
 */
export async function exportWordBlob(params: Record<string, any>): Promise<void> {
    return downloadBlob('/word/build', params, 'report.docx');
}

/**
 * 导出Excel文件（Blob方式）
 * @param params 查询参数
 * @returns 触发文件下载的Promise对象
 */
export async function exportExcelBlob(params: Record<string, any>): Promise<void> {
    return downloadBlob('/excel/build', params, 'report.xlsx');
}

/**
 * 分页导出Excel文件（Blob方式）
 * @param params 查询参数
 * @returns 触发文件下载的Promise对象
 */
export async function exportExcelPagingBlob(params: Record<string, any>): Promise<void> {
    return downloadBlob('/excel/paging', params, 'report.xlsx');
}

/**
 * 分页分Sheet导出Excel文件（Blob方式）
 * @param params 查询参数
 * @returns 触发文件下载的Promise对象
 */
export async function exportExcelSheetPagingBlob(params: Record<string, any>): Promise<void> {
    return downloadBlob('/excel/sheet', params, 'report.xlsx');
}

/**
 * 获取PDF Blob URL（用于iframe预览）
 * @param params 查询参数（URL参数）
 * @param paperVo 纸张配置参数（可选，会进行URL编码）
 * @returns Blob URL
 */
export async function getPdfBlobUrl(params: Record<string, any>, paperVo: any = null): Promise<string> {
    const urlParams = { ...params };
    if (paperVo) {
        urlParams['_paper'] = encodeURIComponent(JSON.stringify(paperVo));
    }
    const queryString = buildQueryString(urlParams);
    const url = queryString ? `/pdf/show?${queryString}` : '/pdf/show';

    const response: any = await request.get(url, {
        responseType: 'blob'
    });

    const blob = response.data || response;
    return URL.createObjectURL(blob);
}

/**
 * 获取PDF Blob（用于直接打印）
 * @param params 查询参数（URL参数）
 * @param paperVo 纸张配置参数（可选，会进行URL编码）
 * @returns Blob URL 和释放函数
 */
export async function getPdfPrintBlob(params: Record<string, any>, paperVo: any = null): Promise<{ blobUrl: string; revoke: () => void }> {
    const urlParams = { ...params };
    if (paperVo) {
        urlParams['_paper'] = encodeURIComponent(JSON.stringify(paperVo));
    }
    const queryString = buildQueryString(urlParams);
    const url = queryString ? `/pdf/show?${queryString}` : '/pdf/show';

    const response: any = await request.get(url, {
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
 * @returns 包含报表数据
 */
export async function loadReportData(params: Record<string, any>): Promise<PreviewReportData> {
    const formData = new URLSearchParams();
    if (params) {
        for (const [key, value] of Object.entries(params)) {
            formData.append(key, value as any);
        }
    }
    return request.post<PreviewReportData>('/html/loadData', formData, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });
}

/**
 * 存储图表数据
 * @param formData 包含图表数据的参数
 */
export async function storeChartData(formData: FormData): Promise<void> {
    return request.post<void>('/chart/storeData', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
}
