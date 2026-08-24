/*******************************************************************************
 * Copyright 2017 Bstek
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License.  You may obtain a copy
 * of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
 * License for the specific language governing permissions and limitations under
 * the License.
 ******************************************************************************/
package com.luck.report.core.export;

import com.luck.report.core.build.paging.Page;
import com.luck.report.core.cache.ChartScopeCache;
import com.luck.report.core.chart.ChartData;
import com.luck.report.core.definition.ReportDefinition;
import com.luck.report.core.export.excel.high.ExcelProducer;
import com.luck.report.core.export.excel.low.Excel97Producer;
import com.luck.report.core.export.html.HtmlProducer;
import com.luck.report.core.export.html.HtmlReport;
import com.luck.report.core.export.pdf.PdfProducer;
import com.luck.report.core.export.word.high.WordProducer;
import com.luck.report.core.model.Report;
import com.luck.report.core.utils.FreezeUtils;
import org.springframework.util.CollectionUtils;

import java.util.List;
import java.util.Map;

/**
 * @author Jacky.gao
 * @since 2016年12月4日
 */
public class ExportManagerImpl implements ExportManager {
    private ReportRender reportRender;
    private HtmlProducer htmlProducer = new HtmlProducer();
    private WordProducer wordProducer = new WordProducer();
    private ExcelProducer excelProducer = new ExcelProducer();
    private Excel97Producer excel97Producer = new Excel97Producer();
    private PdfProducer pdfProducer = new PdfProducer();

    @Override
    public HtmlReport exportHtml(String file, String contextPath, Map<String, Object> parameters) {
        ReportDefinition reportDefinition = reportRender.getReportDefinition(file);
        Report report = reportRender.render(reportDefinition, parameters);
        Map<String, ChartData> chartMap = report.getContext().getChartDataMap();
        if (chartMap.size() > 0) {
            ChartScopeCache.storeChartDataMap(chartMap);
        }
        HtmlReport htmlReport = new HtmlReport();
        String content = htmlProducer.produce(report);
        htmlReport.setContent(content);
        if (reportDefinition.getPaper().isColumnEnabled()) {
            htmlReport.setColumn(reportDefinition.getPaper().getColumnCount());
        }
        htmlReport.setStyle(reportDefinition.getStyle());
        htmlReport.setSearchForm(reportDefinition.buildSearchForm());
        htmlReport.setReportAlign(report.getPaper().getHtmlReportAlign().name());
        htmlReport.setChartDatas(report.getContext().getChartDataMap().values());
        htmlReport.setHtmlIntervalRefreshValue(report.getPaper().getHtmlIntervalRefreshValue());
        applyFreeze(htmlReport, report);
        return htmlReport;
    }

    @Override
    public HtmlReport exportHtml(String file, String contextPath, Map<String, Object> parameters, int pageIndex) {
        ReportDefinition reportDefinition = reportRender.getReportDefinition(file);
        Report report = reportRender.render(reportDefinition, parameters);
        Map<String, ChartData> chartMap = report.getContext().getChartDataMap();
        if (!CollectionUtils.isEmpty(chartMap)) {
            ChartScopeCache.storeChartDataMap(chartMap);
        }
        SinglePageData pageData = PageBuilder.buildSinglePageData(pageIndex, report);
        List<Page> pages = pageData.getPages();
        String content = null;
        if (pages.size() == 1) {
            content = htmlProducer.produce(report.getContext(), pages.get(0), false);
        } else {
            content = htmlProducer.produce(report.getContext(), pages, pageData.getColumnMargin(), false);
        }
        HtmlReport htmlReport = new HtmlReport();
        htmlReport.setContent(content);
        if (reportDefinition.getPaper().isColumnEnabled()) {
            htmlReport.setColumn(reportDefinition.getPaper().getColumnCount());
        }
        htmlReport.setStyle(reportDefinition.getStyle());
        htmlReport.setSearchForm(reportDefinition.buildSearchForm());
        htmlReport.setPageIndex(pageIndex);
        htmlReport.setTotalPage(pageData.getTotalPages());
        htmlReport.setReportAlign(report.getPaper().getHtmlReportAlign().name());
        htmlReport.setChartDatas(report.getContext().getChartDataMap().values());
        htmlReport.setHtmlIntervalRefreshValue(report.getPaper().getHtmlIntervalRefreshValue());
        applyFreeze(htmlReport, report);
        return htmlReport;
    }

    /**
     * 从 Paper 冻结锚点解析展开后物理行列数，写入 HtmlReport（前端 sticky 冻结用）
     * @param htmlReport HTML报表对象，不可空
     * @param report 展开后的报表对象，不可空
     */
    private void applyFreeze(HtmlReport htmlReport, Report report) {
        htmlReport.setFreezeRowCount(FreezeUtils.resolveFreezeRowCount(report, report.getPaper().getFreezeRowCellName()));
        htmlReport.setFreezeColCount(FreezeUtils.resolveFreezeColCount(report, report.getPaper().getFreezeColCellName()));
    }

    @Override
    public void exportPdf(ExportConfigure config) {
        String file = config.getFile();
        Map<String, Object> parameters = config.getParameters();
        ReportDefinition reportDefinition = reportRender.getReportDefinition(file);
        Report report = reportRender.render(reportDefinition, parameters);
        pdfProducer.produce(report, config.getOutputStream());
    }

    @Override
    public void exportWord(ExportConfigure config) {
        String file = config.getFile();
        Map<String, Object> parameters = config.getParameters();
        ReportDefinition reportDefinition = reportRender.getReportDefinition(file);
        Report report = reportRender.render(reportDefinition, parameters);
        wordProducer.produce(report, config.getOutputStream());
    }

    @Override
    public void exportExcel(ExportConfigure config) {
        String file = config.getFile();
        Map<String, Object> parameters = config.getParameters();
        ReportDefinition reportDefinition = reportRender.getReportDefinition(file);
        Report report = reportRender.render(reportDefinition, parameters);
        excelProducer.produce(report, config.getOutputStream());
    }

    @Override
    public void exportExcel97(ExportConfigure config) {
        String file = config.getFile();
        Map<String, Object> parameters = config.getParameters();
        ReportDefinition reportDefinition = reportRender.getReportDefinition(file);
        Report report = reportRender.render(reportDefinition, parameters);
        excel97Producer.produce(report, config.getOutputStream());
    }

    @Override
    public void exportExcelWithPaging(ExportConfigure config) {
        String file = config.getFile();
        Map<String, Object> parameters = config.getParameters();
        ReportDefinition reportDefinition = reportRender.getReportDefinition(file);
        Report report = reportRender.render(reportDefinition, parameters);
        excelProducer.produceWithPaging(report, config.getOutputStream());
    }

    @Override
    public void exportExcel97WithPaging(ExportConfigure config) {
        String file = config.getFile();
        Map<String, Object> parameters = config.getParameters();
        ReportDefinition reportDefinition = reportRender.getReportDefinition(file);
        Report report = reportRender.render(reportDefinition, parameters);
        excel97Producer.produceWithPaging(report, config.getOutputStream());
    }

    @Override
    public void exportExcelWithPagingSheet(ExportConfigure config) {
        String file = config.getFile();
        Map<String, Object> parameters = config.getParameters();
        ReportDefinition reportDefinition = reportRender.getReportDefinition(file);
        Report report = reportRender.render(reportDefinition, parameters);
        excelProducer.produceWithSheet(report, config.getOutputStream());
    }

    @Override
    public void exportExcel97WithPagingSheet(ExportConfigure config) {
        String file = config.getFile();
        Map<String, Object> parameters = config.getParameters();
        ReportDefinition reportDefinition = reportRender.getReportDefinition(file);
        Report report = reportRender.render(reportDefinition, parameters);
        excel97Producer.produceWithSheet(report, config.getOutputStream());
    }

    public void setReportRender(ReportRender reportRender) {
        this.reportRender = reportRender;
    }
}
