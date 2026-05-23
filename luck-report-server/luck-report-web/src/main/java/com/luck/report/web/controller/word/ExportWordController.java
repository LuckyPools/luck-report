package com.luck.report.web.controller.word;

import com.luck.report.core.build.ReportBuilder;
import com.luck.report.core.definition.ReportDefinition;
import com.luck.report.core.exception.ReportException;
import com.luck.report.core.export.ExportConfigure;
import com.luck.report.core.export.ExportConfigureImpl;
import com.luck.report.core.export.ExportManager;
import com.luck.report.core.export.ReportRender;
import com.luck.report.core.export.word.high.WordProducer;
import com.luck.report.core.model.Report;
import com.luck.report.web.constant.ReportConstants;
import com.luck.report.web.service.ReportDefinitionService;
import com.luck.report.web.utils.DownloadUtils;
import com.luck.report.web.utils.UrlParameterUtils;
import com.luck.report.web.exception.ReportDesignException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.OutputStream;
import java.util.Map;

/**
 * Word导出控制器
 * 替代原来的ExportWordServletAction
 */
@RestController("bean.exportWordController")
@RequestMapping("${luck-report.servletPrefix:}/word")
public class ExportWordController {

    @Autowired
    private ReportBuilder reportBuilder;

    @Autowired
    private ExportManager exportManager;

    @Autowired
    private ReportRender reportRender;

    @Autowired
    private ReportDefinitionService reportDefinitionService;

    private final WordProducer wordProducer = new WordProducer();

    /**
     * 构建PDF报表
     */
    @RequestMapping("/build")
    public void build(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        buildWord(req, resp);
    }

    /**
     * 构建Word报表
     */
    public void buildWord(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String fileName = req.getParameter("reportPath");
        String mode = req.getParameter("mode");
        String wordName = req.getParameter("_n");
        
        DownloadUtils.buildDownloadHeader(resp, fileName, wordName, ".docx");
        
        fileName = UrlParameterUtils.doubleDecode(fileName);
        OutputStream outputStream = resp.getOutputStream();
        boolean isPreview = ReportConstants.MODE_KEY.equals(mode);
        try {
            Map<String, Object> parameters = UrlParameterUtils.buildParameters(req);
            if (isPreview) {
                ReportDefinition reportDefinition = reportDefinitionService.getReportDefinition(fileName);
                Report report = reportBuilder.buildReport(reportDefinition, parameters);
                wordProducer.produce(report, outputStream);
            } else {
                ExportConfigure configure = new ExportConfigureImpl(fileName, parameters, outputStream);
                exportManager.exportWord(configure);
            }
        } catch (Exception ex) {
            throw new ReportException(ex);
        } finally {
            outputStream.flush();
            outputStream.close();
        }
    }
}
