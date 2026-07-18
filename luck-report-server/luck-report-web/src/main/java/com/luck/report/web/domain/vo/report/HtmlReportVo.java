package com.luck.report.web.domain.vo.report;

import com.luck.report.web.domain.vo.cell.ChartDataVo;

import java.io.Serializable;
import java.util.Collection;

/**
 * HTML预览报表响应VO
 */
public class HtmlReportVo implements Serializable {

    private static final long serialVersionUID = 1L;

    /** HTML内容 */
    private String content;
    /** 样式 */
    private String style;
    /** 总页数 */
    private int totalPage;
    /** 分栏总页数 */
    private Integer totalPageWithCol;
    /** 当前页码 */
    private int pageIndex;
    /** 报表对齐方式 */
    private String reportAlign;
    /** 图表数据集合 */
    private Collection<ChartDataVo> chartDatas;
    /** 定时刷新间隔（秒） */
    private Integer intervalRefreshValue;
    /** 搜索表单 */
    private Object searchForm;

    public HtmlReportVo() {
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

    public Integer getTotalPageWithCol() {
        return totalPageWithCol;
    }

    public void setTotalPageWithCol(Integer totalPageWithCol) {
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

    public Integer getIntervalRefreshValue() {
        return intervalRefreshValue;
    }

    public void setIntervalRefreshValue(Integer intervalRefreshValue) {
        this.intervalRefreshValue = intervalRefreshValue;
    }

    public Object getSearchForm() {
        return searchForm;
    }

    public void setSearchForm(Object searchForm) {
        this.searchForm = searchForm;
    }
}
