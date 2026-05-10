package com.luck.report.web.controller.html;

import com.luck.report.core.build.Context;
import com.luck.report.core.build.ReportBuilder;
import com.luck.report.core.build.paging.Page;
import com.luck.report.core.cache.CacheUtils;
import com.luck.report.core.chart.ChartData;
import com.luck.report.core.definition.Paper;
import com.luck.report.core.definition.ReportDefinition;
import com.luck.report.core.exception.ReportComputeException;
import com.luck.report.core.export.*;
import com.luck.report.core.export.html.HtmlProducer;
import com.luck.report.core.export.html.HtmlReport;
import com.luck.report.core.model.Report;
import com.luck.report.web.cache.TempObjectCache;
import com.luck.report.web.constant.ReportConstants;
import com.luck.report.web.exception.ReportDesignException;
import com.luck.report.web.utils.ResponseUtils;
import org.apache.commons.lang.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.util.CollectionUtils;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.*;

@RestController("bean.htmlPreviewController")
@RequestMapping("${luck-report.servletPrefix}/html")
public class HtmlPreviewController {

    private final Logger log = LoggerFactory.getLogger(getClass());

    private final HtmlProducer htmlProducer = new HtmlProducer();
    @Autowired
    private ExportManager exportManager;
    @Autowired
    private ReportBuilder reportBuilder;
    @Autowired
    private ReportRender reportRender;

    @RequestMapping("/loadHtml")
    public void loadHtml(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        Map<String, Object> result = new HashMap<String, Object>();
        HtmlReport htmlReport = null;
        try {
            htmlReport = loadReport(req);
        } catch (Exception ex) {
            if (!(ex instanceof ReportDesignException)) {
                log.error("加载报表异常",ex);
            }
            String errorMsg = buildExceptionMessage(ex);
            result.put("errorMsg", errorMsg);
        }
        if (htmlReport != null) {
            result.put("searchForm", htmlReport.getSearchForm());
            result.put("content", htmlReport.getContent());
            result.put("style", htmlReport.getStyle());
            result.put("reportAlign", htmlReport.getReportAlign());
            result.put("totalPage", htmlReport.getTotalPage());
            result.put("totalPageWithCol", htmlReport.getTotalPageWithCol());
            result.put("pageIndex", htmlReport.getPageIndex());
            result.put("chartDatas", htmlReport.getChartDatas());
            result.put("intervalRefreshValue", htmlReport.getHtmlIntervalRefreshValue());
        }
        ResponseUtils.writeObjectToJson(resp, result);
    }

    @RequestMapping("/loadPrintPages")
    public void loadPrintPages(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        String mode = req.getParameter("mode");
        boolean isPreview = ReportConstants.MODE_KEY.equals(mode);
        String fileName = req.getParameter("reportPath");
        fileName = decode(fileName);
        Map<String, Object> parameters = buildParameters(req);
        ReportDefinition reportDefinition = null;
        if (isPreview) {
            reportDefinition = (ReportDefinition) TempObjectCache.getObject(fileName);
            if (reportDefinition == null) {
                throw new ReportDesignException("Report data has expired,can not do export excel.");
            }
        } else {
            reportDefinition = reportRender.getReportDefinition(fileName);
        }
        Report report = reportBuilder.buildReport(reportDefinition, parameters);
        Map<String, ChartData> chartMap = report.getContext().getChartDataMap();
        if (!chartMap.isEmpty()) {
            CacheUtils.storeChartDataMap(chartMap);
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
        ResponseUtils.writeObjectToJson(resp, map);
    }

    @RequestMapping("/loadPagePaper")
    public void loadPagePaper(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        String mode = req.getParameter("mode");
        boolean isPreview = ReportConstants.MODE_KEY.equals(mode);
        String fileName = req.getParameter("reportPath");
        fileName = decode(fileName);
        ReportDefinition report;
        if (isPreview) {
            report = (ReportDefinition) TempObjectCache.getObject(fileName);
            if (report == null) {
                throw new ReportDesignException("Report data has expired.");
            }
        } else {
            report = reportRender.getReportDefinition(fileName);
        }
        Paper paper = report.getPaper();
        ResponseUtils.writeObjectToJson(resp, paper);
    }

    @RequestMapping("/loadData")
    public void loadData(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        HtmlReport htmlReport = loadReport(req);
        ResponseUtils.writeObjectToJson(resp, htmlReport);
    }

    private HtmlReport loadReport(HttpServletRequest req) {
        Map<String, Object> parameters = buildParameters(req);
        HtmlReport htmlReport;
        String pageIndex = req.getParameter("_i");
        String fileName = req.getParameter("reportPath");
        String mode = req.getParameter("mode");
        boolean isPreview = ReportConstants.MODE_KEY.equals(mode);
        fileName = decode(fileName);
        if (StringUtils.isBlank(fileName)) {
            throw new ReportComputeException("Report file can not be null.");
        }
        if (isPreview) {
            ReportDefinition reportDefinition = (ReportDefinition) TempObjectCache.getObject(fileName);
            if (reportDefinition == null) {
                throw new ReportDesignException("Report data has expired,can not do preview.");
            }
            Report report = reportBuilder.buildReport(reportDefinition, parameters);
            Map<String, ChartData> chartMap = report.getContext().getChartDataMap();
            if (!CollectionUtils.isEmpty(chartMap)) {
                CacheUtils.storeChartDataMap(chartMap);
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

    protected String decode(String value) {
        if (value == null) {
            return value;
        }
        try {
            value = java.net.URLDecoder.decode(value, "utf-8");
            value = java.net.URLDecoder.decode(value, "utf-8");
            return value;
        } catch (Exception ex) {
            return value;
        }
    }

}
