package com.luck.report.web.domain.vo.report;

import com.luck.report.core.provider.report.ReportFile;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

/**
 * 报表提供者详情 VO。
 *
 * <p>在 {@link ReportProviderVo} 基础上附加指定路径下的报表文件列表，
 * 用于 {@code /designer/loadReportProviders?path=xxx} 接口。
 *
 * <p>响应结构为 {@code Map<prefix, ReportProviderDetailVo>}，key 为 provider 前缀。
 *
 * @author luck-report
 * @since 1.0.0
 */
@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ReportProviderDetailVo extends ReportProviderVo implements Serializable {

    private static final long serialVersionUID = 1L;

    /** 指定路径下的报表文件列表（含目录）。 */
    private List<ReportFile> reportFiles;

    public ReportProviderDetailVo(String name, String prefix, boolean disabled, List<ReportFile> reportFiles) {
        super(name, prefix, disabled);
        this.reportFiles = reportFiles;
    }
}
