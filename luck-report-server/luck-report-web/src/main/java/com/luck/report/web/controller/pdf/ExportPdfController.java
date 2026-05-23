package com.luck.report.web.controller.pdf;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.luck.report.core.build.ReportBuilder;
import com.luck.report.core.definition.Paper;
import com.luck.report.core.definition.ReportDefinition;
import com.luck.report.core.exception.ReportException;
import com.luck.report.core.export.ReportRender;
import com.luck.report.core.export.pdf.PdfProducer;
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
 * PDF导出控制器
 */
@RestController("bean.exportPdfController")
@RequestMapping("${luck-report.servletPrefix:}/pdf")
public class ExportPdfController {

    @Autowired
    private ReportBuilder reportBuilder;

    @Autowired
    private ReportRender reportRender;

    @Autowired
    private ReportDefinitionService reportDefinitionService;

    private final PdfProducer pdfProducer = new PdfProducer();

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
     * @param req HTTP请求对象
     * @param resp HTTP响应对象
     * @throws IOException IO异常
     */
    @RequestMapping("/show")
    public void show(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/pdf");
        buildPdf(req, resp);
    }


    /**
     * 构建PDF报表核心方法
     * @param req HTTP请求对象
     * @param resp HTTP响应对象
     * @throws IOException IO异常
     */
    private void buildPdf(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String mode = req.getParameter("mode");
        String fileName = req.getParameter("reportPath");
        fileName = UrlParameterUtils.doubleDecode(fileName);
        boolean isPreview = ReportConstants.MODE_KEY.equals(mode);
        OutputStream outputStream = null;
        try {
            outputStream = resp.getOutputStream();
            ReportDefinition reportDefinition;
            Map<String, Object> parameters = UrlParameterUtils.buildParameters(req);
            if (isPreview) {
                reportDefinition = reportDefinitionService.getReportDefinition(fileName);
            } else {
                reportDefinition = reportRender.getReportDefinition(fileName);
            }

            Report report = reportBuilder.buildReport(reportDefinition, parameters);
            String paperJson = req.getParameter("_paper");
            if (paperJson != null && !paperJson.isEmpty()) {
                ObjectMapper mapper = new ObjectMapper();
                Paper newPaper = mapper.readValue(paperJson, Paper.class);
                report.rePaging(newPaper);
            }

            pdfProducer.produce(report, outputStream);
        } catch (Exception ex) {
            throw new ReportException(ex);
        } finally {
            if (outputStream != null) {
                outputStream.flush();
                outputStream.close();
            }
        }
    }
}
