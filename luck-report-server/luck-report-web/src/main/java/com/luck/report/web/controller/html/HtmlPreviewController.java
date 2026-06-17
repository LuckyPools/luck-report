package com.luck.report.web.controller.html;

import com.luck.report.common.domain.vo.ResultVO;
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
import com.luck.report.web.service.ReportDefinitionService;
import com.luck.report.web.utils.UrlParameterUtils;
import com.luck.report.web.domain.vo.ChartDataVo;
import com.luck.report.web.exception.ReportDesignException;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.util.CollectionUtils;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.*;

@RestController("bean.htmlPreviewController")
@RequestMapping("${luck-report.servletPrefix:}/html")
public class HtmlPreviewController {

    private final Logger log = LoggerFactory.getLogger(getClass());

    private final HtmlProducer htmlProducer = new HtmlProducer();
    @Autowired
    private ExportManager exportManager;
    @Autowired
    private ReportBuilder reportBuilder;
    @Autowired
    private ReportRender reportRender;
    @Autowired
    private ReportDefinitionService reportDefinitionService;

    @RequestMapping("/loadHtml")
    public ResultVO<Map<String, Object>> loadHtml(HttpServletRequest req) throws Exception {
        Map<String, Object> result = new HashMap<String, Object>();
        HtmlReport htmlReport;
        htmlReport = loadReport(req);
        if (htmlReport != null) {
            Collection<ChartDataVo> chartDataVoList = convertToChartDataVo(htmlReport.getChartDatas());
            result.put("searchForm", htmlReport.getSearchForm());
            result.put("content", htmlReport.getContent());
            result.put("style", htmlReport.getStyle());
            result.put("reportAlign", htmlReport.getReportAlign());
            result.put("totalPage", htmlReport.getTotalPage());
            result.put("totalPageWithCol", htmlReport.getTotalPageWithCol());
            result.put("pageIndex", htmlReport.getPageIndex());
            result.put("chartDatas", chartDataVoList);
            result.put("intervalRefreshValue", htmlReport.getHtmlIntervalRefreshValue());
        }
        return ResultVO.success(result);
    }

    @RequestMapping("/loadPrintPages")
    public ResultVO<Map<String, String>> loadPrintPages(HttpServletRequest req) throws Exception {
        String mode = req.getParameter("mode");
        boolean isPreview = ReportConstants.MODE_KEY.equals(mode);
        String fileName = req.getParameter("reportPath");
        fileName = UrlParameterUtils.doubleDecode(fileName);
        Map<String, Object> parameters = UrlParameterUtils.buildParameters(req);
        ReportDefinition reportDefinition;
        if (isPreview) {
            reportDefinition = reportDefinitionService.getReportDefinition(fileName);
        } else {
            reportDefinition = reportRender.getReportDefinition(fileName);
        }
        Report report = reportBuilder.buildReport(reportDefinition, parameters);
        Map<String, ChartData> chartMap = report.getContext().getChartDataMap();
        if (!chartMap.isEmpty()) {
            ChartScopeCache.storeChartDataMap(chartMap);
        }
        FullPageData pageData = PageBuilder.buildFullPageData(report);
        StringBuilder sb = new StringBuilder();
        List<List<Page>> list = pageData.getPageList();
        Context context = report.getContext();
        if (!list.isEmpty()) {
            for (int i = 0; i < list.size(); i++) {
                List<Page> columnPages = list.get(i);
                if (i == 0) {
                    String html = htmlProducer.produce(context, columnPages, pageData.getColumnMargin(), false);
                    sb.append(html);
                } else {
                    String html = htmlProducer.produce(context, columnPages, pageData.getColumnMargin(), false);
                    sb.append(html);
                }
            }
        } else {
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
        Map<String, String> map = new HashMap<String, String>();
        map.put("html", sb.toString());
        return ResultVO.success(map);
    }

    @RequestMapping("/loadPagePaper")
    public ResultVO<Paper> loadPagePaper(HttpServletRequest req) throws Exception {
        String mode = req.getParameter("mode");
        boolean isPreview = ReportConstants.MODE_KEY.equals(mode);
        String fileName = req.getParameter("reportPath");
        fileName = UrlParameterUtils.doubleDecode(fileName);
        ReportDefinition reportDefinition;
        if (isPreview) {
            reportDefinition = reportDefinitionService.getReportDefinition(fileName);
        } else {
            reportDefinition = reportRender.getReportDefinition(fileName);
        }
        Paper paper = reportDefinition.getPaper();
        return ResultVO.success(paper);
    }

    @RequestMapping("/loadData")
    public ResultVO<Map<String, Object>> loadData(HttpServletRequest req) throws Exception {
        HtmlReport htmlReport = loadReport(req);
        Map<String, Object> result = new HashMap<>();
        if (htmlReport != null) {
            Collection<ChartDataVo> chartDataVoList = convertToChartDataVo(htmlReport.getChartDatas());

            result.put("content", htmlReport.getContent());
            result.put("style", htmlReport.getStyle());
            result.put("totalPage", htmlReport.getTotalPage());
            result.put("totalPageWithCol", htmlReport.getTotalPageWithCol());
            result.put("pageIndex", htmlReport.getPageIndex());
            result.put("chartDatas", chartDataVoList);
            result.put("intervalRefreshValue", htmlReport.getHtmlIntervalRefreshValue());
            result.put("searchForm", htmlReport.getSearchForm());
            result.put("reportAlign", htmlReport.getReportAlign());
        }
        return ResultVO.success(result);
    }


    private HtmlReport loadReport(HttpServletRequest req) {
        Map<String, Object> parameters = UrlParameterUtils.buildParameters(req);
        HtmlReport htmlReport;
        String pageIndex = req.getParameter("_i");
        String fileName = req.getParameter("reportPath");
        String mode = req.getParameter("mode");
        boolean isPreview = ReportConstants.MODE_KEY.equals(mode);
        fileName = UrlParameterUtils.doubleDecode(fileName);
        if (StringUtils.isBlank(fileName)) {
            throw new ReportComputeException("Report file can not be null");
        }
        if (isPreview) {
            ReportDefinition reportDefinition = reportDefinitionService.getReportDefinition(fileName);
            Report report = reportBuilder.buildReport(reportDefinition, parameters);
            Map<String, ChartData> chartMap = report.getContext().getChartDataMap();
            if (!CollectionUtils.isEmpty(chartMap)) {
                ChartScopeCache.storeChartDataMap(chartMap);
            }
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
            if (StringUtils.isNotBlank(pageIndex) && !pageIndex.equals("0")) {
                int index = Integer.parseInt(pageIndex);
                htmlReport = exportManager.exportHtml(fileName, req.getContextPath(), parameters, index);
            } else {
                htmlReport = exportManager.exportHtml(fileName, req.getContextPath(), parameters);
            }
        }
        return htmlReport;
    }

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

    private String buildExceptionMessage(Throwable throwable) {
        Throwable root = buildRootException(throwable);
        StringWriter sw = new StringWriter();
        PrintWriter pw = new PrintWriter(sw);
        root.printStackTrace(pw);
        String trace = sw.getBuffer().toString();
        trace = trace.replaceAll("\n", "<br>");
        pw.close();
        return trace;
    }

    protected Throwable buildRootException(Throwable throwable) {
        if (throwable.getCause() == null) {
            return throwable;
        }
        return buildRootException(throwable.getCause());
    }

}
