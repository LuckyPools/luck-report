package com.luck.report.web.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.luck.report.core.build.ReportBuilder;
import com.luck.report.core.definition.Paper;
import com.luck.report.core.definition.ReportDefinition;
import com.luck.report.core.exception.ReportComputeException;
import com.luck.report.core.exception.ReportException;
import com.luck.report.core.export.ExportConfigure;
import com.luck.report.core.export.ExportConfigureImpl;
import com.luck.report.core.export.ExportManager;
import com.luck.report.core.export.ReportRender;
import com.luck.report.core.export.excel.high.ExcelProducer;
import com.luck.report.core.export.excel.low.Excel97Producer;
import com.luck.report.core.export.pdf.PdfProducer;
import com.luck.report.core.export.word.high.WordProducer;
import com.luck.report.core.model.Report;
import com.luck.report.web.constant.ReportConstants;
import com.luck.report.web.utils.UrlParameterUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.io.OutputStream;
import java.util.Map;

/**
 * 报表导出服务，统一处理 Excel / Excel97 / PDF / Word 导出业务。
 * <p>Bean 名：{@code bean.reportExportService}，避免与第三方系统 Bean 冲突。
 *
 * @author luck-report
 * @since 1.0.0
 */
@Service("bean.reportExportService")
public class ReportExportService {

    @Autowired
    private ReportBuilder reportBuilder;

    @Autowired
    private ExportManager exportManager;

    @Autowired
    private ReportRender reportRender;

    @Autowired
    private ReportDefinitionService reportDefinitionService;

    private final ExcelProducer excelProducer = new ExcelProducer();
    private final Excel97Producer excel97Producer = new Excel97Producer();
    private final PdfProducer pdfProducer = new PdfProducer();
    private final WordProducer wordProducer = new WordProducer();

    /**
     * 构建 Excel (xlsx) 报表。
     */
    public void buildExcel(String filePath, String mode, HttpServletRequest req, OutputStream outputStream,
                           boolean withPage, boolean withSheet) throws IOException {
        if (StringUtils.isBlank(filePath)) {
            throw new ReportComputeException("Report file can not be null.");
        }
        boolean isPreview = ReportConstants.MODE_KEY.equals(mode);
        try {
            Map<String, Object> parameters = UrlParameterUtils.buildParameters(req);
            if (isPreview) {
                ReportDefinition reportDefinition = reportDefinitionService.getReportDefinition(filePath);
                Report report = reportBuilder.buildReport(reportDefinition, parameters);
                if (withPage) {
                    excelProducer.produceWithPaging(report, outputStream);
                } else if (withSheet) {
                    excelProducer.produceWithSheet(report, outputStream);
                } else {
                    excelProducer.produce(report, outputStream);
                }
            } else {
                ExportConfigure configure = new ExportConfigureImpl(filePath, parameters, outputStream);
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
        }
    }

    /**
     * 构建 Excel97 (xls) 报表。
     */
    public void buildExcel97(String filePath, String mode, HttpServletRequest req, OutputStream outputStream,
                             boolean withPage, boolean withSheet) throws IOException {
        boolean isPreview = ReportConstants.MODE_KEY.equals(mode);
        Map<String, Object> parameters = UrlParameterUtils.buildParameters(req);
        if (isPreview) {
            ReportDefinition reportDefinition = reportDefinitionService.getReportDefinition(filePath);
            Report report = reportBuilder.buildReport(reportDefinition, parameters);
            if (withPage) {
                excel97Producer.produceWithPaging(report, outputStream);
            } else if (withSheet) {
                excel97Producer.produceWithSheet(report, outputStream);
            } else {
                excel97Producer.produce(report, outputStream);
            }
        } else {
            ExportConfigure configure = new ExportConfigureImpl(filePath, parameters, outputStream);
            if (withPage) {
                exportManager.exportExcelWithPaging(configure);
            } else if (withSheet) {
                exportManager.exportExcelWithPagingSheet(configure);
            } else {
                exportManager.exportExcel(configure);
            }
        }
    }

    /**
     * 构建 PDF 报表。
     */
    public void buildPdf(String filePath, String mode, String paperJson, HttpServletRequest req,
                         OutputStream outputStream) throws IOException {
        boolean isPreview = ReportConstants.MODE_KEY.equals(mode);
        try {
            ReportDefinition reportDefinition;
            Map<String, Object> parameters = UrlParameterUtils.buildParameters(req);
            if (isPreview) {
                reportDefinition = reportDefinitionService.getReportDefinition(filePath);
            } else {
                reportDefinition = reportRender.getReportDefinition(filePath);
            }

            Report report = reportBuilder.buildReport(reportDefinition, parameters);
            if (paperJson != null && !paperJson.isEmpty()) {
                ObjectMapper mapper = new ObjectMapper();
                Paper newPaper = mapper.readValue(paperJson, Paper.class);
                report.rePaging(newPaper);
            }

            pdfProducer.produce(report, outputStream);
        } catch (Exception ex) {
            throw new ReportException(ex);
        }
    }

    /**
     * 构建 Word 报表。
     */
    public void buildWord(String filePath, String mode, HttpServletRequest req, OutputStream outputStream) throws IOException {
        boolean isPreview = ReportConstants.MODE_KEY.equals(mode);
        try {
            Map<String, Object> parameters = UrlParameterUtils.buildParameters(req);
            if (isPreview) {
                ReportDefinition reportDefinition = reportDefinitionService.getReportDefinition(filePath);
                Report report = reportBuilder.buildReport(reportDefinition, parameters);
                wordProducer.produce(report, outputStream);
            } else {
                ExportConfigure configure = new ExportConfigureImpl(filePath, parameters, outputStream);
                exportManager.exportWord(configure);
            }
        } catch (Exception ex) {
            throw new ReportException(ex);
        }
    }
}
