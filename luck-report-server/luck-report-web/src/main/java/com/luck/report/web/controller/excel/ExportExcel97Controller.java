package com.luck.report.web.controller.excel;

import com.luck.report.core.build.ReportBuilder;
import com.luck.report.core.definition.ReportDefinition;
import com.luck.report.core.export.ExportConfigure;
import com.luck.report.core.export.ExportConfigureImpl;
import com.luck.report.core.export.ExportManager;
import com.luck.report.core.export.ReportRender;
import com.luck.report.core.export.excel.low.Excel97Producer;
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
 * Excel 97-2003导出控制器
 * 替代原有的ExportExcel97ServletAction，提供Excel 97-2003格式导出功能
 */
@RestController("bean.exportExcel97Controller")
@RequestMapping("${luck-report.servletPrefix:}/excel97")
public class ExportExcel97Controller {

    @Autowired
    private ReportBuilder reportBuilder;

    @Autowired
    private ExportManager exportManager;

    @Autowired
    private ReportRender reportRender;

    @Autowired
    private ReportDefinitionService reportDefinitionService;

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
        String mode = req.getParameter("mode");
        String excelName = req.getParameter("_n");
        DownloadUtils.buildDownloadHeader(resp, fileName, excelName, ".xls");
        fileName = UrlParameterUtils.doubleDecode(fileName);
        Map<String, Object> parameters = UrlParameterUtils.buildParameters(req);
        boolean isPreview = ReportConstants.MODE_KEY.equals(mode);
        OutputStream outputStream = resp.getOutputStream();
        if (isPreview) {
            ReportDefinition reportDefinition = reportDefinitionService.getReportDefinition(fileName);
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
}
