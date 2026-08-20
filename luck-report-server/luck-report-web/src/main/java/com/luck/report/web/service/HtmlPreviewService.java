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
import com.luck.report.infra.modules.servlet.provider.RequestInfoProvider;
import com.luck.report.web.utils.UrlParameterUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;

/**
 * HTML预览服务，负责HTML报表的加载、打印页、纸张信息等业务
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

    private final HtmlProducer htmlProducer = new HtmlProducer();

    /**
     * 加载HTML预览内容并组装返回数据
     *
     * @param req       HTTP请求对象
     * @param pageIndex 页码索引，可为空
     * @param mode      运行模式，可为空
     * @return HTML预览报表VO
     */
    public HtmlReportVo loadHtml(RequestInfoProvider req, String pageIndex, String mode) {
        Map<String, Object> parameters = UrlParameterUtils.buildParameters(req);
        HtmlReport htmlReport = loadReport(req, pageIndex, mode, parameters);
        return toVo(htmlReport);
    }

    /**
     * 加载打印页HTML（合并多列/多页输出）
     *
     * @param req  HTTP请求对象
     * @param mode 运行模式，可为空
     * @return 打印页HTML内容
     */
    public String loadPrintPages(RequestInfoProvider req, String mode) {
        String reportPath = req.getParameter("reportPath");
        reportPath = UrlParameterUtils.doubleDecode(reportPath);
        Map<String, Object> parameters = UrlParameterUtils.buildParameters(req);
        boolean isPreview = ReportConstants.MODE_KEY.equals(mode);
        ReportDefinition reportDefinition;
        if (isPreview) reportDefinition = reportDefinitionService.getReportDefinition(reportPath);
        else reportDefinition = reportRender.getReportDefinition(reportPath);
        Report report = reportBuilder.buildReport(reportDefinition, parameters);
        FullPageData pageData = PageBuilder.buildFullPageData(report);
        StringBuilder sb = new StringBuilder();
        List<List<Page>> list = pageData.getPageList();
        Context context = report.getContext();
        if (!list.isEmpty()) for (int i = 0; i < list.size(); i++) {
            List<Page> columnPages = list.get(i);
            if (i == 0) {
                String html = htmlProducer.produce(context, columnPages, pageData.getColumnMargin(), false);
                sb.append(html);
            } else {
                String html = htmlProducer.produce(context, columnPages, pageData.getColumnMargin(), false);
                sb.append(html);
            }
        }
        else {
            List<Page> pages = report.getPages();
            for (int i = 0; i < pages.size(); i++) {
                Page page = pages.get(i);
                if (i == 0) {
                    String html = htmlProducer.produce(context, page, false);
                    sb.append(html);
                } else {
                    String html = htmlProducer.produce(context, page, true);
                    sb.append(html);
                }
            }
        }
        return sb.toString();
    }

    /**
     * 加载报表纸张信息
     *
     * @param req  HTTP请求对象
     * @param mode 运行模式，可为空
     * @return 纸张信息
     */
    public Paper loadPagePaper(RequestInfoProvider req, String mode) {
        String reportPath = req.getParameter("reportPath");
        reportPath = UrlParameterUtils.doubleDecode(reportPath);
        boolean isPreview = ReportConstants.MODE_KEY.equals(mode);
        ReportDefinition reportDefinition;
        if (isPreview) reportDefinition = reportDefinitionService.getReportDefinition(reportPath);
        else reportDefinition = reportRender.getReportDefinition(reportPath);
        return reportDefinition.getPaper();
    }

    /**
     * 加载报表数据（不渲染HTML，只返回分页信息和图表数据）
     *
     * @param req       HTTP请求对象
     * @param pageIndex 页码索引，可为空
     * @param mode      运行模式，可为空
     * @return HTML预览报表VO
     */
    public HtmlReportVo loadData(RequestInfoProvider req, String pageIndex, String mode) {
        Map<String, Object> parameters = UrlParameterUtils.buildParameters(req);
        HtmlReport htmlReport = loadReport(req, pageIndex, mode, parameters);
        return toVo(htmlReport);
    }

    /**
     * 加载并渲染报表HTML
     *
     * @param req        HTTP请求对象
     * @param pageIndex  页码索引，可为空
     * @param mode       运行模式，可为空
     * @param parameters 报表参数
     * @return HTML报表对象
     */
    private HtmlReport loadReport(RequestInfoProvider req, String pageIndex, String mode, Map<String, Object> parameters) {
        String reportPath = req.getParameter("reportPath");
        reportPath = UrlParameterUtils.doubleDecode(reportPath);
        if (StringUtils.isBlank(reportPath)) throw new ReportComputeException("Report file can not be null");
        boolean isPreview = ReportConstants.MODE_KEY.equals(mode);
        HtmlReport htmlReport;
        if (isPreview) {
            ReportDefinition reportDefinition = reportDefinitionService.getReportDefinition(reportPath);
            Report report = reportBuilder.buildReport(reportDefinition, parameters);
            Map<String, ChartData> chartMap = report.getContext().getChartDataMap();
            if (!CollectionUtils.isEmpty(chartMap)) ChartScopeCache.storeChartDataMap(chartMap);
            htmlReport = new HtmlReport();
            String html;
            if (StringUtils.isNotBlank(pageIndex) && !pageIndex.equals("0")) {
                Context context = report.getContext();
                int index = Integer.parseInt(pageIndex);
                SinglePageData pageData = PageBuilder.buildSinglePageData(index, report);
                List<Page> pages = pageData.getPages();
                if (pages.size() == 1) {
                    Page page = pages.get(0);
                    html = htmlProducer.produce(context, page, false);
                } else html = htmlProducer.produce(context, pages, pageData.getColumnMargin(), false);
                htmlReport.setTotalPage(pageData.getTotalPages());
                htmlReport.setPageIndex(index);
            } else html = htmlProducer.produce(report);
            if (report.getPaper().isColumnEnabled()) htmlReport.setColumn(report.getPaper().getColumnCount());
            htmlReport.setChartDatas(report.getContext().getChartDataMap().values());
            htmlReport.setContent(html);
            htmlReport.setTotalPage(report.getPages().size());
            htmlReport.setStyle(reportDefinition.getStyle());
            htmlReport.setSearchForm(reportDefinition.buildSearchForm());
            htmlReport.setReportAlign(report.getPaper().getHtmlReportAlign().name());
            htmlReport.setHtmlIntervalRefreshValue(report.getPaper().getHtmlIntervalRefreshValue());
        } else if (StringUtils.isNotBlank(pageIndex) && !pageIndex.equals("0")) {
            int index = Integer.parseInt(pageIndex);
            htmlReport = exportManager.exportHtml(reportPath, req.getContextPath(), parameters, index);
        } else htmlReport = exportManager.exportHtml(reportPath, req.getContextPath(), parameters);
        return htmlReport;
    }

    /**
     * 将HtmlReport转换为HtmlReportVo
     *
     * @param htmlReport HTML报表对象，可为空
     * @return HTML预览报表VO
     */
    private HtmlReportVo toVo(HtmlReport htmlReport) {
        if (htmlReport == null) return new HtmlReportVo();
        HtmlReportVo vo = new HtmlReportVo();
        vo.setContent(htmlReport.getContent());
        vo.setStyle(htmlReport.getStyle());
        vo.setTotalPage(htmlReport.getTotalPage());
        vo.setTotalPageWithCol(htmlReport.getTotalPageWithCol());
        vo.setPageIndex(htmlReport.getPageIndex());
        vo.setReportAlign(htmlReport.getReportAlign());
        vo.setChartDatas(convertToChartDataVo(htmlReport.getChartDatas()));
        vo.setIntervalRefreshValue(htmlReport.getHtmlIntervalRefreshValue());
        vo.setSearchForm(htmlReport.getSearchForm());
        return vo;
    }

    /**
     * ChartData集合转换为ChartDataVo集合
     *
     * @param chartDatas ChartData集合，可为空
     * @return ChartDataVo集合
     */
    public Collection<ChartDataVo> convertToChartDataVo(Collection<ChartData> chartDatas) {
        Collection<ChartDataVo> chartDataVos = new ArrayList<>();
        if (chartDatas == null || chartDatas.isEmpty()) return chartDataVos;
        for (ChartData chartData : chartDatas) {
            ChartDataVo chartDataVo = new ChartDataVo(chartData.getId(), chartData.getJson());
            chartDataVos.add(chartDataVo);
        }
        return chartDataVos;
    }
}
