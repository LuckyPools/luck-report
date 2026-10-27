package com.luck.report.web.controller.pdf;

import com.luck.report.core.definition.ReportDefinition;
import com.luck.report.web.controller.base.BaseController;
import com.luck.report.web.service.ReportExportService;
import com.luck.report.web.utils.DownloadUtils;
import com.luck.report.web.utils.UrlParameterUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.io.OutputStream;

/**
 * PDF导出控制器，仅负责HTTP请求/响应转换，业务逻辑委托给ReportExportService
 */
@RestController("bean.exportPdfController")
@RequestMapping("${luck-report.servletPrefix:}/pdf")
public class ExportPdfController extends BaseController {

    @Autowired
    @Qualifier("bean.reportExportService")
    private ReportExportService reportExportService;

    /**
     * 构建PDF报表（下载）。预览模式须在写下载头前取缓存，避免过期时返回空附件。
     */
    @RequestMapping("/build")
    public void build() throws IOException {
        String reportPath = req.getParameter("reportPath");
        String pdfName = req.getParameter("_n");
        String mode = req.getParameter("mode");
        String paperJson = req.getParameter("_paper");
        String decodedPath = UrlParameterUtils.doubleDecode(reportPath);
        ReportDefinition definition = reportExportService.getPreviewDefinition(mode, decodedPath);
        DownloadUtils.buildDownloadHeader(resp, reportPath, pdfName, ".pdf");
        writePdf(decodedPath, mode, paperJson, definition);
    }

    /**
     * 显示PDF报表（POST方式，支持传递纸张参数）
     */
    @RequestMapping("/show")
    public void show() throws IOException {
        String mode = req.getParameter("mode");
        String reportPath = req.getParameter("reportPath");
        String paperJson = req.getParameter("_paper");
        String decodedPath = UrlParameterUtils.doubleDecode(reportPath);
        ReportDefinition definition = reportExportService.getPreviewDefinition(mode, decodedPath);
        resp.setContentType("application/pdf");
        writePdf(decodedPath, mode, paperJson, definition);
    }

    private void writePdf(String reportPath, String mode, String paperJson, ReportDefinition definition) throws IOException {
        OutputStream outputStream = null;
        try {
            outputStream = resp.getOutputStream();
            reportExportService.buildPdf(reportPath, mode, paperJson, req, outputStream, definition);
        } finally {
            if (outputStream != null) {
                outputStream.flush();
                outputStream.close();
            }
        }
    }
}
