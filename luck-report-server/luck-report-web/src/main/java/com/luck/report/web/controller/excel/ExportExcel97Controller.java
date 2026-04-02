package com.luck.report.web.controller.excel;

import com.luck.report.core.build.ReportBuilder;
import com.luck.report.core.definition.ReportDefinition;
import com.luck.report.core.exception.ReportComputeException;
import com.luck.report.core.export.ExportConfigure;
import com.luck.report.core.export.ExportConfigureImpl;
import com.luck.report.core.export.ExportManager;
import com.luck.report.core.export.excel.low.Excel97Producer;
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
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;

/**
 * Excel 97-2003导出控制器
 * 替代原有的ExportExcel97ServletAction，提供Excel 97-2003格式导出功能
 */
@RestController("bean.exportExcel97Controller")
@RequestMapping("${luck-report.servletPrefix}/excel97")
public class ExportExcel97Controller {

    @Autowired
    private ReportBuilder reportBuilder;

    @Autowired
    private ExportManager exportManager;

    private final Excel97Producer excelProducer = new Excel97Producer();

    @RequestMapping("/build")
    public void build(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        buildExcel(req, resp, false, false);
    }

    @RequestMapping( "/paging")
    public void paging(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        buildExcel(req, resp, true, false);
    }

    @RequestMapping( "/sheet")
    public void sheet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        buildExcel(req, resp, false, true);
    }

    private void buildExcel(HttpServletRequest req, HttpServletResponse resp, boolean withPage, boolean withSheet) throws IOException {
        String fileName = req.getParameter("reportPath");
        fileName = decode(fileName);
        String mode = req.getParameter("mode");
        boolean isPreview = ReportConstants.MODE_KEY.equals(mode);
        String excelName = req.getParameter("_n");
        if (StringUtils.isNotBlank(excelName)) {
            excelName = decode(excelName);
        } else {
            excelName = "luck-report.xls";
        }
        resp.setContentType("application/octet-stream;charset=ISO8859-1");
        resp.setHeader("Content-Disposition", "attachment;filename=\"" + excelName + "\"");
        Map<String, Object> parameters = buildParameters(req);
        OutputStream outputStream = resp.getOutputStream();
        if (isPreview) {
            ReportDefinition reportDefinition = (ReportDefinition) TempObjectCache.getObject(fileName);
            if (reportDefinition == null) {
                throw new ReportDesignException("Report data has expired,can not do export excel.");
            }
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
        outputStream.flush();
        outputStream.close();
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
}
