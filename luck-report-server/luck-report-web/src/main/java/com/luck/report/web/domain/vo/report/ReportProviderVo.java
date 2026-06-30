package com.luck.report.web.domain.vo.report;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * 报表提供者（Provider）视图对象。
 *
 * <p>对应 {@code /designer/loadReportProviders} 接口的列表项，
 * 字段与前端 {@code ReportProviderVO} 对齐：
 * <ul>
 *   <li>name: provider 展示名（如"服务器文件系统"、"数据库"）</li>
 *   <li>prefix: provider 前缀（如"file:"、"db:"），用于 filePath 拼接</li>
 *   <li>disabled: 是否禁用；禁用的 provider 不会出现在管理 UI 中</li>
 * </ul>
 *
 * <p>需要同时获取 provider 信息与文件列表时，使用 {@link ReportProviderDetailVo}，
 * 对应 {@code /designer/loadReportFiles} 接口。
 *
 * @author luck-report
 * @since 1.0.0
 */
@Data
@NoArgsConstructor
public class ReportProviderVo implements Serializable {

    private static final long serialVersionUID = 1L;

    private String name;
    private String prefix;
    private boolean disabled;

    public ReportProviderVo(String name, String prefix, boolean disabled) {
        this.name = name;
        this.prefix = prefix;
        this.disabled = disabled;
    }
}
