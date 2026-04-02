package com.luck.report.web.controller.word;

import com.luck.report.core.build.ReportBuilder;
import com.luck.report.core.definition.ReportDefinition;
import com.luck.report.core.exception.ReportComputeException;
import com.luck.report.core.exception.ReportException;
import com.luck.report.core.export.ExportConfigure;
import com.luck.report.core.export.ExportConfigureImpl;
import com.luck.report.core.export.ExportManager;
import com.luck.report.core.export.word.high.WordProducer;
import com.luck.report.core.model.Report;
import com.luck.report.web.cache.TempObjectCache;
import com.luck.report.web.constant.ReportConstants;
import com.luck.report.web.exception.ReportDesignException;
import org.apache.commons.lang.StringUtils;
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
 * Word导出控制器
 * 替代原来的ExportWordServletAction
 */
@RestController("bean.exportWordController")
@RequestMapping("${luck-report.servletPrefix}/word")
public class ExportWordController {

    @Autowired
    private ReportBuilder reportBuilder;

    @Autowired
    private ExportManager exportManager;

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
        fileName = decode(fileName);
        String mode = req.getParameter("mode");
        boolean isPreview = ReportConstants.MODE_KEY.equals(mode);
        OutputStream outputStream = resp.getOutputStream();
        try {
            String wordName = req.getParameter("_n");
            wordName = buildDownloadFileName(ReportConstants.MODE_KEY, wordName, ".docx");
            wordName = new String(wordName.getBytes(StandardCharsets.UTF_8), "ISO8859-1");
            resp.setContentType("application/octet-stream;charset=ISO8859-1");
            resp.setHeader("Content-Disposition", "attachment;filename=\"" + wordName + "\"");
            Map<String, Object> parameters = buildParameters(req);
            if (isPreview) {
                ReportDefinition reportDefinition = (ReportDefinition) TempObjectCache.getObject(fileName);
                if (reportDefinition == null) {
                    throw new ReportDesignException("Report data has expired,can not do export word.");
                }
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

    /**
     * URL解码
     */
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

    /**
     * 构建请求参数
     */
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

    /**
     * 构建下载文件名
     */
    protected String buildDownloadFileName(String reportFileName, String fileName, String extName) {
        if (StringUtils.isNotBlank(fileName)) {
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
