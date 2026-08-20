package com.luck.report.web.controller.pdf;

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
     * 构建PDF报表（下载）
     */
    @RequestMapping("/build")
    public void build() throws IOException {
        String reportPath = req.getParameter("reportPath");
        String pdfName = req.getParameter("_n");
        DownloadUtils.buildDownloadHeader(resp, reportPath, pdfName, ".pdf");
        buildPdf();
    }

    /**
     * 显示PDF报表（POST方式，支持传递纸张参数）
     */
    @RequestMapping("/show")
    public void show() throws IOException {
        resp.setContentType("application/pdf");
        buildPdf();
    }

    /**
     * 构建PDF报表并写入响应流
     */
    private void buildPdf() throws IOException {
        String mode = req.getParameter("mode");
        String reportPath = req.getParameter("reportPath");
        String paperJson = req.getParameter("_paper");
        reportPath = UrlParameterUtils.doubleDecode(reportPath);
        OutputStream outputStream = null;
        try {
            outputStream = resp.getOutputStream();
            reportExportService.buildPdf(reportPath, mode, paperJson, req, outputStream);
        } finally {
            if (outputStream != null) {
                outputStream.flush();
                outputStream.close();
            }
        }
    }
}
