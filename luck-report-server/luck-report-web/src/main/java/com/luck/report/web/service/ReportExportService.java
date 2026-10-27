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
import com.luck.report.infra.modules.servlet.provider.RequestInfoProvider;
import com.luck.report.web.utils.UrlParameterUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.OutputStream;
import java.util.Map;

/**
 * 报表导出服务，统一处理Excel/Excel97/PDF/Word导出业务
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

    private static final String EXPIRED_EXPORT_MESSAGE = "Report data has expired, can not export file";

    private final ExcelProducer excelProducer = new ExcelProducer();
    private final Excel97Producer excel97Producer = new Excel97Producer();
    private final PdfProducer pdfProducer = new PdfProducer();
    private final WordProducer wordProducer = new WordProducer();

    /**
     * 预览时从缓存取报表定义，须在写下载头之前调用；其它模式返回 null
     *
     * @param mode       导出模式
     * @param reportPath 报表路径（已解码）
     * @return 预览报表定义；非预览为 null
     */
    public ReportDefinition getPreviewDefinition(String mode, String reportPath) {
        if (!ReportConstants.MODE_KEY.equals(mode)) {
            return null;
        }
        if (StringUtils.isBlank(reportPath)) {
            throw new ReportComputeException("Report file can not be null");
        }
        return reportDefinitionService.getReportDefinition(reportPath);
    }

    /**
     * 构建Excel(xlsx)报表
     *
     * @param reportPath   报表文件路径
     * @param mode         运行模式，可为空
     * @param req          HTTP请求对象
     * @param outputStream 输出流
     * @param withPage     是否分页导出
     * @param withSheet    是否按Sheet导出
     * @param definition   预览定义，非预览传 null
     */
    public void buildExcel(String reportPath, String mode, RequestInfoProvider req, OutputStream outputStream,
                           boolean withPage, boolean withSheet, ReportDefinition definition) {
        if (StringUtils.isBlank(reportPath)) throw new ReportComputeException("Report file can not be null.");
        try {
            Map<String, Object> parameters = UrlParameterUtils.buildParameters(req);
            if (ReportConstants.MODE_KEY.equals(mode)) {
                if (definition == null) {
                    throw new ReportComputeException(EXPIRED_EXPORT_MESSAGE);
                }
                Report report = reportBuilder.buildReport(definition, parameters);
                if (withPage) excelProducer.produceWithPaging(report, outputStream);
                else if (withSheet) excelProducer.produceWithSheet(report, outputStream);
                else excelProducer.produce(report, outputStream);
            } else {
                ExportConfigure configure = new ExportConfigureImpl(reportPath, parameters, outputStream);
                if (withPage) exportManager.exportExcelWithPaging(configure);
                else if (withSheet) exportManager.exportExcelWithPagingSheet(configure);
                else exportManager.exportExcel(configure);
            }
        } catch (Exception ex) {
            throw new ReportException(ex);
        }
    }

    /**
     * 构建Excel97(xls)报表
     *
     * @param reportPath   报表文件路径
     * @param mode         运行模式，可为空
     * @param req          HTTP请求对象
     * @param outputStream 输出流
     * @param withPage     是否分页导出
     * @param withSheet    是否按Sheet导出
     * @param definition   预览定义，非预览传 null
     */
    public void buildExcel97(String reportPath, String mode, RequestInfoProvider req, OutputStream outputStream,
                             boolean withPage, boolean withSheet, ReportDefinition definition) throws IOException {
        Map<String, Object> parameters = UrlParameterUtils.buildParameters(req);
        if (ReportConstants.MODE_KEY.equals(mode)) {
            if (definition == null) {
                throw new ReportComputeException(EXPIRED_EXPORT_MESSAGE);
            }
            Report report = reportBuilder.buildReport(definition, parameters);
            if (withPage) excel97Producer.produceWithPaging(report, outputStream);
            else if (withSheet) excel97Producer.produceWithSheet(report, outputStream);
            else excel97Producer.produce(report, outputStream);
        } else {
            ExportConfigure configure = new ExportConfigureImpl(reportPath, parameters, outputStream);
            if (withPage) exportManager.exportExcelWithPaging(configure);
            else if (withSheet) exportManager.exportExcelWithPagingSheet(configure);
            else exportManager.exportExcel(configure);
        }
    }

    /**
     * 构建PDF报表
     *
     * @param reportPath   报表文件路径
     * @param mode         运行模式，可为空
     * @param paperJson    纸张参数JSON，可为空
     * @param req          HTTP请求对象
     * @param outputStream 输出流
     * @param definition   预览定义，非预览传 null
     */
    public void buildPdf(String reportPath, String mode, String paperJson, RequestInfoProvider req,
                         OutputStream outputStream, ReportDefinition definition) throws IOException {
        try {
            ReportDefinition reportDefinition;
            Map<String, Object> parameters = UrlParameterUtils.buildParameters(req);
            if (ReportConstants.MODE_KEY.equals(mode)) {
                if (definition == null) {
                    throw new ReportComputeException(EXPIRED_EXPORT_MESSAGE);
                }
                reportDefinition = definition;
            } else {
                reportDefinition = reportRender.getReportDefinition(reportPath);
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
     * 构建Word报表
     *
     * @param reportPath   报表文件路径
     * @param mode         运行模式，可为空
     * @param req          HTTP请求对象
     * @param outputStream 输出流
     * @param definition   预览定义，非预览传 null
     */
    public void buildWord(String reportPath, String mode, RequestInfoProvider req, OutputStream outputStream,
                          ReportDefinition definition) throws IOException {
        try {
            Map<String, Object> parameters = UrlParameterUtils.buildParameters(req);
            if (ReportConstants.MODE_KEY.equals(mode)) {
                if (definition == null) {
                    throw new ReportComputeException(EXPIRED_EXPORT_MESSAGE);
                }
                Report report = reportBuilder.buildReport(definition, parameters);
                wordProducer.produce(report, outputStream);
            } else {
                ExportConfigure configure = new ExportConfigureImpl(reportPath, parameters, outputStream);
                exportManager.exportWord(configure);
            }
        } catch (Exception ex) {
            throw new ReportException(ex);
        }
    }
}
