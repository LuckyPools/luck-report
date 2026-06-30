package com.luck.report.web.modules.report.domain.vo.report;

import com.luck.report.core.definition.searchform.SearchForm;
import com.luck.report.web.modules.report.domain.vo.cell.ChartDataVo;

import java.io.Serializable;
import java.util.Collection;

/**
 * HTML 预览报表视图对象，用于 {@code /html/loadHtml} 与 {@code /html/loadData} 接口返回。
 * <p>字段名与前端 {@code PreviewReportData} 契约保持一致，避免破坏调用方。
 *
 * @author luck-report
 * @since 1.0.0
 */
public class HtmlReportVo implements Serializable {

    private static final long serialVersionUID = 1L;

    private String reportName;
    private String content;
    private String style;
    private int totalPage;
    private int totalPageWithCol;
    private int pageIndex;
    private String reportAlign;
    private Collection<ChartDataVo> chartDatas;
    private int intervalRefreshValue;
    private SearchForm searchForm;

    public HtmlReportVo() {
    }

    public HtmlReportVo(String content, String style, int totalPage, int totalPageWithCol,
                        int pageIndex, String reportAlign, Collection<ChartDataVo> chartDatas,
                        int intervalRefreshValue, SearchForm searchForm) {
        this.content = content;
        this.style = style;
        this.totalPage = totalPage;
        this.totalPageWithCol = totalPageWithCol;
        this.pageIndex = pageIndex;
        this.reportAlign = reportAlign;
        this.chartDatas = chartDatas;
        this.intervalRefreshValue = intervalRefreshValue;
        this.searchForm = searchForm;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getStyle() {
        return style;
    }

    public void setStyle(String style) {
        this.style = style;
    }

    public int getTotalPage() {
        return totalPage;
    }

    public void setTotalPage(int totalPage) {
        this.totalPage = totalPage;
    }

    public int getTotalPageWithCol() {
        return totalPageWithCol;
    }

    public void setTotalPageWithCol(int totalPageWithCol) {
        this.totalPageWithCol = totalPageWithCol;
    }

    public int getPageIndex() {
        return pageIndex;
    }

    public void setPageIndex(int pageIndex) {
        this.pageIndex = pageIndex;
    }

    public String getReportAlign() {
        return reportAlign;
    }

    public void setReportAlign(String reportAlign) {
        this.reportAlign = reportAlign;
    }

    public Collection<ChartDataVo> getChartDatas() {
        return chartDatas;
    }

    public void setChartDatas(Collection<ChartDataVo> chartDatas) {
        this.chartDatas = chartDatas;
    }

    public int getIntervalRefreshValue() {
        return intervalRefreshValue;
    }

    public void setIntervalRefreshValue(int intervalRefreshValue) {
        this.intervalRefreshValue = intervalRefreshValue;
    }

    public SearchForm getSearchForm() {
        return searchForm;
    }

    public void setSearchForm(SearchForm searchForm) {
        this.searchForm = searchForm;
    }

    public String getReportName() {
        return reportName;
    }

    public void setReportName(String reportName) {
        this.reportName = reportName;
    }
}
