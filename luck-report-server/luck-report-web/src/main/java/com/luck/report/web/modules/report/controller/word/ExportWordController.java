package com.luck.report.web.modules.report.controller.word;

import com.luck.report.web.modules.report.service.ReportExportService;
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
 * Word导出控制器
 * <p>仅负责 HTTP 请求 / 响应转换，业务逻辑委托给 {@link ReportExportService}。
 */
@RestController("bean.exportWordController")
@RequestMapping("${luck-report.servletPrefix:}/word")
public class ExportWordController {

    @Autowired
    @Qualifier("bean.reportExportService")
    private ReportExportService reportExportService;

    /**
     * 构建Word报表
     */
    @RequestMapping("/build")
    public void build(@RequestParam("filePath") String filePath,
                      @RequestParam(value = "_m", required = false) String mode,
                      @RequestParam(value = "_n", required = false) String wordName,
                      HttpServletRequest req,
                      HttpServletResponse resp) throws IOException {
        DownloadUtils.buildDownloadHeader(resp, filePath, wordName, ".docx");
        OutputStream outputStream = resp.getOutputStream();
        try {
            reportExportService.buildWord(filePath, mode, req, outputStream);
        } finally {
            outputStream.flush();
            outputStream.close();
        }
    }
}
