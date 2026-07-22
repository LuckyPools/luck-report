package com.luck.report.web.controller.word;

import com.luck.report.web.controller.base.BaseController;
import com.luck.report.web.service.ReportExportService;
import com.luck.report.web.utils.DownloadUtils;
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
     * 构建Word报表
     */
    @RequestMapping("/build")
    public void build() throws IOException {
        String fileName = req.getParameter("reportPath");
        String mode = req.getParameter("mode");
        String wordName = req.getParameter("_n");
        DownloadUtils.buildDownloadHeader(resp, fileName, wordName, ".docx");
        fileName = com.luck.report.web.utils.UrlParameterUtils.doubleDecode(fileName);
        OutputStream outputStream = resp.getOutputStream();
        try {
            reportExportService.buildWord(fileName, mode, req, outputStream);
        } finally {
            outputStream.flush();
            outputStream.close();
        }
    }
}
