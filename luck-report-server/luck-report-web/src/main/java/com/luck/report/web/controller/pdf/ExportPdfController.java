package com.luck.report.web.controller.pdf;

import com.luck.report.web.service.ReportExportService;
import com.luck.report.web.utils.DownloadUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.OutputStream;

/**
 * PDF导出控制器，仅负责HTTP请求/响应转换，业务逻辑委托给ReportExportService
 */
@RestController("bean.exportPdfController")
@RequestMapping("${luck-report.servletPrefix:}/pdf")
public class ExportPdfController {

    @Autowired
    @Qualifier("bean.reportExportService")
    private ReportExportService reportExportService;

    /**
     * 构建PDF报表（下载）
     */
    @RequestMapping("/build")
    public void build(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String fileName = req.getParameter("reportPath");
        String pdfName = req.getParameter("_n");
        DownloadUtils.buildDownloadHeader(resp, fileName, pdfName, ".pdf");
        buildPdf(req, resp);
    }

    /**
     * 显示PDF报表（POST方式，支持传递纸张参数）
     */
    @RequestMapping("/show")
    public void show(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/pdf");
        buildPdf(req, resp);
    }

    /**
     * 构建PDF报表并写入响应流
     */
    private void buildPdf(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String mode = req.getParameter("mode");
        String fileName = req.getParameter("reportPath");
        String paperJson = req.getParameter("_paper");
        fileName = com.luck.report.web.utils.UrlParameterUtils.doubleDecode(fileName);
        OutputStream outputStream = null;
        try {
            outputStream = resp.getOutputStream();
            reportExportService.buildPdf(fileName, mode, paperJson, req, outputStream);
        } finally {
            if (outputStream != null) {
                outputStream.flush();
                outputStream.close();
            }
        }
    }
}
