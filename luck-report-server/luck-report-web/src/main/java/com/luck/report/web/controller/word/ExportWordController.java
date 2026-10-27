package com.luck.report.web.controller.word;

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
 * Word导出控制器，仅负责HTTP请求/响应转换，业务逻辑委托给ReportExportService
 */
@RestController("bean.exportWordController")
@RequestMapping("${luck-report.servletPrefix:}/word")
public class ExportWordController extends BaseController {

    @Autowired
    @Qualifier("bean.reportExportService")
    private ReportExportService reportExportService;

    /**
     * 构建Word报表。预览模式须在写下载头前取缓存，避免过期时返回空附件。
     */
    @RequestMapping("/build")
    public void build() throws IOException {
        String reportPath = req.getParameter("reportPath");
        String mode = req.getParameter("mode");
        String wordName = req.getParameter("_n");
        String decodedPath = UrlParameterUtils.doubleDecode(reportPath);
        ReportDefinition definition = reportExportService.getPreviewDefinition(mode, decodedPath);
        DownloadUtils.buildDownloadHeader(resp, reportPath, wordName, ".docx");
        OutputStream outputStream = resp.getOutputStream();
        try {
            reportExportService.buildWord(decodedPath, mode, req, outputStream, definition);
        } finally {
            outputStream.flush();
            outputStream.close();
        }
    }
}
