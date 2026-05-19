package com.luck.report.web.controller.pdf;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.luck.report.core.build.ReportBuilder;
import com.luck.report.core.definition.Paper;
import com.luck.report.core.definition.ReportDefinition;
import com.luck.report.core.exception.ReportException;
import com.luck.report.core.export.ExportConfigure;
import com.luck.report.core.export.ExportConfigureImpl;
import com.luck.report.core.export.ExportManager;
import com.luck.report.core.export.ReportRender;
import com.luck.report.core.export.pdf.PdfProducer;
import com.luck.report.core.model.Report;
import com.luck.report.web.cache.ReportScopedCache;
import com.luck.report.web.constant.ReportConstants;
import com.luck.report.web.exception.ReportDesignException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.OutputStream;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;

/**
 * PDF导出控制器
 */
@RestController("bean.exportPdfController")
@RequestMapping("${luck-report.servletPrefix}/pdf")
public class ExportPdfController {

    @Autowired
    private ReportBuilder reportBuilder;

    @Autowired
    private ExportManager exportManager;

    @Autowired
    private ReportRender reportRender;

    private final PdfProducer pdfProducer = new PdfProducer();

    /**
     * 构建PDF报表（下载）
     */
    @RequestMapping("/build")
    public void build(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pdfName = req.getParameter("_n");
        pdfName = buildDownloadFileName(ReportConstants.MODE_KEY, pdfName, ".pdf");
        pdfName = new String(pdfName.getBytes(StandardCharsets.UTF_8), "ISO8859-1");
        resp.setContentType("application/octet-stream;charset=ISO8859-1");
        resp.setHeader("Content-Disposition", "attachment;filename=\"" + pdfName + "\"");
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
        fileName = decode(fileName);
        boolean isPreview = ReportConstants.MODE_KEY.equals(mode);
        OutputStream outputStream = null;
        try {
            Map<String, Object> parameters = buildParameters(req);
            outputStream = resp.getOutputStream();
            if (isPreview) {
                ReportDefinition reportDefinition = (ReportDefinition) ReportScopedCache.getObject(fileName);
                if (reportDefinition == null) {
                    throw new ReportDesignException("Report data has expired,can not do export pdf.");
                }
                reportRender.rebuildReportDefinition(reportDefinition);
                Report report = reportBuilder.buildReport(reportDefinition, parameters);

                String paperJson = req.getParameter("_paper");
                if (paperJson != null && !paperJson.isEmpty()) {
                    ObjectMapper mapper = new ObjectMapper();
                    Paper newPaper = mapper.readValue(paperJson, Paper.class);
                    report.rePaging(newPaper);
                }

                pdfProducer.produce(report, outputStream);
            } else {
                ExportConfigure configure = new ExportConfigureImpl(fileName, parameters, outputStream);
                exportManager.exportPdf(configure);
            }
        } catch (Exception ex) {
            throw new ReportException(ex);
        } finally {
            if (outputStream != null) {
                outputStream.flush();
                outputStream.close();
            }
        }
    }

    protected String decode(String value) {
        if (value == null) {
            return value;
        }
        try {
            value = URLDecoder.decode(value, "utf-8");
            value = URLDecoder.decode(value, "utf-8");
            return value;
        } catch (Exception ex) {
            return value;
        }
    }

    protected Map<String, Object> buildParameters(HttpServletRequest req) {
        Map<String, Object> parameters = new HashMap<String, Object>();
        Enumeration<?> enumeration = req.getParameterNames();
        while (enumeration.hasMoreElements()) {
            Object obj = enumeration.nextElement();
            if (obj == null) {
                continue;
            }
            String name = obj.toString();
            String value = req.getParameter(name);
            if (name == null || value == null || name.startsWith("_")) {
                continue;
            }
            parameters.put(name, decode(value));
        }
        return parameters;
    }

    protected String buildDownloadFileName(String reportFileName, String fileName, String extName) {
        if (org.apache.commons.lang3.StringUtils.isNotBlank(fileName)) {
            fileName = decode(fileName);
            if (!fileName.toLowerCase().endsWith(extName)) {
                fileName = fileName + extName;
            }
            return fileName;
        } else {
            int pos = reportFileName.indexOf(":");
            if (pos > 0) {
                reportFileName = reportFileName.substring(pos + 1);
            }
            pos = reportFileName.toLowerCase().indexOf(".ureport.xml");
            if (pos > 0) {
                reportFileName = reportFileName.substring(0, pos);
            }
            return "ureport-" + reportFileName + extName;
        }
    }
}
