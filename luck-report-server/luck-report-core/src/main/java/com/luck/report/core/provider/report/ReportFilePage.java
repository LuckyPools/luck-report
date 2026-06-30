package com.luck.report.core.provider.report;

import java.io.Serializable;
import java.util.Collections;
import java.util.List;

/**
 * {@link ReportProvider#pageReportFiles(int, int, java.util.Map)} 的分页结果。
 * <p>位于 luck-report-core 内，不依赖 luck-report-common，避免反向依赖。
 *
 * @author luck-report
 * @since 1.0.0
 */
public class ReportFilePage implements Serializable {

    private static final long serialVersionUID = 1L;

    /** 当前页数据 */
    private List<ReportFile> records;
    /** 过滤后总记录数（用于前端分页） */
    private long total;

    public ReportFilePage() {
        this.records = Collections.emptyList();
        this.total = 0L;
    }

    public ReportFilePage(List<ReportFile> records, long total) {
        this.records = records == null ? Collections.emptyList() : records;
        this.total = total;
    }

    public static ReportFilePage of(List<ReportFile> records, long total) {
        return new ReportFilePage(records, total);
    }

    public static ReportFilePage empty() {
        return new ReportFilePage();
    }

    public List<ReportFile> getRecords() {
        return records;
    }

    public void setRecords(List<ReportFile> records) {
        this.records = records == null ? Collections.emptyList() : records;
    }

    public long getTotal() {
        return total;
    }

    public void setTotal(long total) {
        this.total = total;
    }
}
