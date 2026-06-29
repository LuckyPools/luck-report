package com.luck.report.web.controller.pdf;

import com.luck.report.web.service.ReportExportService;
import com.luck.report.web.utils.DownloadUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.OutputStream;

/**
 * PDF导出控制器
 * <p>仅负责 HTTP 请求 / 响应转换，业务逻辑委托给 {@link ReportExportService}。
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
    public void build(@RequestParam("filePath") String filePath,
                      @RequestParam(value = "_n", required = false) String pdfName,
                      @RequestParam(value = "_m", required = false) String mode,
                      @RequestParam(value = "_paper", required = false) String paperJson,
                      HttpServletRequest req,
                      HttpServletResponse resp) throws IOException {
        DownloadUtils.buildDownloadHeader(resp, filePath, pdfName, ".pdf");
        OutputStream outputStream = resp.getOutputStream();
        try {
            reportExportService.buildPdf(filePath, mode, paperJson, req, outputStream);
        } finally {
            if (outputStream != null) {
                outputStream.flush();
                outputStream.close();
            }
        }
    }

    /**
     * 显示PDF报表（POST方式，支持传递纸张参数）
     */
    @RequestMapping("/show")
    public void show(@RequestParam("filePath") String filePath,
                     @RequestParam(value = "_m", required = false) String mode,
                     @RequestParam(value = "_paper", required = false) String paperJson,
                     HttpServletRequest req,
                     HttpServletResponse resp) throws IOException {
        resp.setContentType("application/pdf");
        OutputStream outputStream = resp.getOutputStream();
        try {
            reportExportService.buildPdf(filePath, mode, paperJson, req, outputStream);
        } finally {
            if (outputStream != null) {
                outputStream.flush();
                outputStream.close();
            }
        }
    }
}
