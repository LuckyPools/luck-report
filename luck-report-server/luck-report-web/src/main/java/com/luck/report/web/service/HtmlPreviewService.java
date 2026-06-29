package com.luck.report.web.service;

import com.luck.report.core.build.Context;
import com.luck.report.core.build.ReportBuilder;
import com.luck.report.core.build.paging.Page;
import com.luck.report.core.cache.ChartScopeCache;
import com.luck.report.core.chart.ChartData;
import com.luck.report.core.definition.Paper;
import com.luck.report.core.definition.ReportDefinition;
import com.luck.report.core.exception.ReportComputeException;
import com.luck.report.core.export.*;
import com.luck.report.core.export.html.HtmlProducer;
import com.luck.report.core.export.html.HtmlReport;
import com.luck.report.core.model.Report;
import com.luck.report.web.constant.ReportConstants;
import com.luck.report.web.domain.vo.cell.ChartDataVo;
import com.luck.report.web.domain.vo.report.HtmlReportVo;
import com.luck.report.web.utils.UrlParameterUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import javax.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;

/**
 * HTML 预览服务，负责 HTML 报表的加载、打印页、纸张信息等业务。
 * <p>Bean 名：{@code bean.htmlPreviewService}，避免与第三方系统 Bean 冲突。
 *
 * @author luck-report
 * @since 1.0.0
 */
@Service("bean.htmlPreviewService")
public class HtmlPreviewService {

    @Autowired
    private ExportManager exportManager;

    @Autowired
    private ReportBuilder reportBuilder;

    @Autowired
    private ReportRender reportRender;

    @Autowired
    private ReportDefinitionService reportDefinitionService;

    @Autowired
    private DesignerService designerService;

    private final HtmlProducer htmlProducer = new HtmlProducer();

    /**
     * 加载 HTML 预览内容并组装返回数据。
     */
    public HtmlReportVo loadHtml(String filePath, String mode, String pageIndex, HttpServletRequest req) {
        String contextPath = req.getContextPath();
        Map<String, Object> parameters = UrlParameterUtils.buildParameters(req);
        HtmlReport htmlReport = loadReport(filePath, mode, pageIndex, contextPath, parameters);
        HtmlReportVo vo = toVo(htmlReport);
        vo.setReportName(designerService.resolveProvider(filePath).getReportFile(filePath).getName());
        return vo;
    }

    /**
     * 加载打印页 HTML（合并多列 / 多页输出）。
     */
    public String loadPrintPages(String filePath, String mode, HttpServletRequest req) {
        boolean isPreview = ReportConstants.MODE_KEY.equals(mode);
        Map<String, Object> parameters = UrlParameterUtils.buildParameters(req);
        ReportDefinition reportDefinition;
        if (isPreview) {
            reportDefinition = reportDefinitionService.getReportDefinition(filePath);
        } else {
            reportDefinition = reportRender.getReportDefinition(filePath);
        }
        Report report = reportBuilder.buildReport(reportDefinition, parameters);
        Map<String, ChartData> chartMap = report.getContext().getChartDataMap();
        if (chartMap != null && !chartMap.isEmpty()) {
            ChartScopeCache.storeChartDataMap(chartMap);
        }
        FullPageData pageData = PageBuilder.buildFullPageData(report);
        StringBuilder sb = new StringBuilder();
        List<List<Page>> list = pageData.getPageList();
        Context context = report.getContext();
        if (!list.isEmpty()) {
            for (int i = 0; i < list.size(); i++) {
                List<Page> columnPages = list.get(i);
                String html = htmlProducer.produce(context, columnPages, pageData.getColumnMargin(), false);
                sb.append(html);
            }
        } else {
            List<Page> pages = report.getPages();
            for (int i = 0; i < pages.size(); i++) {
                Page page = pages.get(i);
                boolean isPaging = i != 0;
                String html = htmlProducer.produce(context, page, isPaging);
                sb.append(html);
            }
        }
        return sb.toString();
    }

    /**
     * 加载报表纸张信息。
     */
    public Paper loadPagePaper(String filePath, String mode) {
        boolean isPreview = ReportConstants.MODE_KEY.equals(mode);
        ReportDefinition reportDefinition;
        if (isPreview) {
            reportDefinition = reportDefinitionService.getReportDefinition(filePath);
        } else {
            reportDefinition = reportRender.getReportDefinition(filePath);
        }
        return reportDefinition.getPaper();
    }

    /**
     * 加载报表数据（不渲染 HTML，只返回分页信息和图表数据）。
     */
    public HtmlReportVo loadData(String filePath, String mode, String pageIndex, HttpServletRequest req) {
        String contextPath = req.getContextPath();
        Map<String, Object> parameters = UrlParameterUtils.buildParameters(req);
        HtmlReport htmlReport = loadReport(filePath, mode, pageIndex, contextPath, parameters);
        return toVo(htmlReport);
    }

    /**
     * 加载并渲染报表 HTML。
     */
    public HtmlReport loadReport(String filePath, String mode, String pageIndex,
                                 String contextPath, Map<String, Object> parameters) {
        if (StringUtils.isBlank(filePath)) {
            throw new ReportComputeException("Report file can not be null");
        }
        HtmlReport htmlReport;
        boolean isPreview = ReportConstants.MODE_KEY.equals(mode);
        if (isPreview) {
            ReportDefinition reportDefinition = reportDefinitionService.getReportDefinition(filePath);
            Report report = reportBuilder.buildReport(reportDefinition, parameters);
            Map<String, ChartData> chartMap = report.getContext().getChartDataMap();
            if (!CollectionUtils.isEmpty(chartMap)) {
                ChartScopeCache.storeChartDataMap(chartMap);
            }
            htmlReport = new HtmlReport();
            String html;
            if (StringUtils.isNotBlank(pageIndex) && !"0".equals(pageIndex)) {
                Context context = report.getContext();
                int index = Integer.parseInt(pageIndex);
                SinglePageData pageData = PageBuilder.buildSinglePageData(index, report);
                List<Page> pages = pageData.getPages();
                if (pages.size() == 1) {
                    Page page = pages.get(0);
                    html = htmlProducer.produce(context, page, false);
                } else {
                    html = htmlProducer.produce(context, pages, pageData.getColumnMargin(), false);
                }
                htmlReport.setTotalPage(pageData.getTotalPages());
                htmlReport.setPageIndex(index);
            } else {
                html = htmlProducer.produce(report);
            }
            if (report.getPaper().isColumnEnabled()) {
                htmlReport.setColumn(report.getPaper().getColumnCount());
            }
            htmlReport.setChartDatas(report.getContext().getChartDataMap().values());
            htmlReport.setContent(html);
            htmlReport.setTotalPage(report.getPages().size());
            htmlReport.setStyle(reportDefinition.getStyle());
            htmlReport.setSearchForm(reportDefinition.buildSearchForm());
            htmlReport.setReportAlign(report.getPaper().getHtmlReportAlign().name());
            htmlReport.setHtmlIntervalRefreshValue(report.getPaper().getHtmlIntervalRefreshValue());
        } else {
            if (StringUtils.isNotBlank(pageIndex) && !"0".equals(pageIndex)) {
                int index = Integer.parseInt(pageIndex);
                htmlReport = exportManager.exportHtml(filePath, contextPath, parameters, index);
            } else {
                htmlReport = exportManager.exportHtml(filePath, contextPath, parameters);
            }
        }
        return htmlReport;
    }

    private HtmlReportVo toVo(HtmlReport htmlReport) {
        if (htmlReport == null) {
            return new HtmlReportVo();
        }
        return new HtmlReportVo(
                htmlReport.getContent(),
                htmlReport.getStyle(),
                htmlReport.getTotalPage(),
                htmlReport.getTotalPageWithCol(),
                htmlReport.getPageIndex(),
                htmlReport.getReportAlign(),
                convertToChartDataVo(htmlReport.getChartDatas()),
                htmlReport.getHtmlIntervalRefreshValue(),
                htmlReport.getSearchForm()
        );
    }

    /**
     * ChartData 转 ChartDataVo。
     */
    public Collection<ChartDataVo> convertToChartDataVo(Collection<ChartData> chartDatas) {
        Collection<ChartDataVo> chartDataVos = new ArrayList<>();
        if (chartDatas == null || chartDatas.isEmpty()) {
            return chartDataVos;
        }
        for (ChartData chartData : chartDatas) {
            ChartDataVo chartDataVo = new ChartDataVo(chartData.getId(), chartData.getJson());
            chartDataVos.add(chartDataVo);
        }
        return chartDataVos;
    }
}
