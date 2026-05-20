package com.luck.report.web.controller.excel;

import com.luck.report.core.build.ReportBuilder;
import com.luck.report.core.definition.ReportDefinition;
import com.luck.report.core.exception.ReportComputeException;
import com.luck.report.core.exception.ReportException;
import com.luck.report.core.export.ExportConfigure;
import com.luck.report.core.export.ExportConfigureImpl;
import com.luck.report.core.export.ExportManager;
import com.luck.report.core.export.ReportRender;
import com.luck.report.core.export.excel.high.ExcelProducer;
import com.luck.report.core.model.Report;
import com.luck.report.web.cache.ReportScopedCache;
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
 * Excel导出控制器
 * 替代原来的ExportExcelServletAction
 */
@RestController("bean.exportExcelController")
@RequestMapping("${luck-report.servletPrefix:report}/excel")
public class ExportExcelController {

    @Autowired
    private ReportBuilder reportBuilder;

    @Autowired
    private ExportManager exportManager;

    @Autowired
    private ReportRender reportRender;

    private final ExcelProducer excelProducer = new ExcelProducer();

    /**
     * 构建Excel报表
     */
    @RequestMapping("/build")
    public void build(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        buildExcel(req, resp, false, false);
    }

    /**
     * 分页导出Excel报表
     */
    @RequestMapping("/paging")
    public void paging(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        buildExcel(req, resp, true, false);
    }

    /**
     * 按Sheet导出Excel报表
     */
    @RequestMapping("/sheet")
    public void sheet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        buildExcel(req, resp, false, true);
    }

    private void buildExcel(HttpServletRequest req, HttpServletResponse resp, boolean withPage, boolean withSheet) throws IOException {
        String fileName = req.getParameter("reportPath");
        fileName = decode(fileName);
        String mode = req.getParameter("mode");
        boolean isPreview = ReportConstants.MODE_KEY.equals(mode);
        if (StringUtils.isBlank(fileName)) {
            throw new ReportComputeException("Report file can not be null.");
        }
        OutputStream outputStream = resp.getOutputStream();
        try {
            String excelName = req.getParameter("_n");
            excelName = buildDownloadFileName(ReportConstants.MODE_KEY,excelName, ".xlsx");
            excelName = new String(excelName.getBytes(StandardCharsets.UTF_8), "ISO8859-1");
            resp.setContentType("application/octet-stream;charset=ISO8859-1");
            resp.setHeader("Content-Disposition", "attachment;filename=\"" + excelName + "\"");
            Map<String, Object> parameters = buildParameters(req);
            if (isPreview) {
                ReportDefinition reportDefinition = (ReportDefinition) ReportScopedCache.getObject(fileName);
                if (reportDefinition == null) {
                    throw new ReportDesignException("Report data has expired,can not do export excel.");
                }
                reportRender.rebuildReportDefinition(reportDefinition);
                Report report = reportBuilder.buildReport(reportDefinition, parameters);
                if (withPage) {
                    excelProducer.produceWithPaging(report, outputStream);
                } else if (withSheet) {
                    excelProducer.produceWithSheet(report, outputStream);
                } else {
                    excelProducer.produce(report, outputStream);
                }
            } else {
                ExportConfigure configure = new ExportConfigureImpl(fileName, parameters, outputStream);
                if (withPage) {
                    exportManager.exportExcelWithPaging(configure);
                } else if (withSheet) {
                    exportManager.exportExcelWithPagingSheet(configure);
                } else {
                    exportManager.exportExcel(configure);
                }
            }
        } catch (Exception ex) {
            throw new ReportException(ex);
        } finally {
            outputStream.flush();
            outputStream.close();
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
