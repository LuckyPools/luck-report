package com.luck.report.web.modules.role.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * 角色 × 报表 绑定关系实体。
 * <p>对应数据库表 {@code luck_report_role}，使用 (role_code, file_path) 复合主键，
 * 物理删除（无 is_deleted 字段）。
 *
 * @author luck-report
 * @since 1.2.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportRole implements Serializable {

    private static final long serialVersionUID = 1L;

    /** 角色编码（第三方系统角色 ID） */
    private String roleCode;

    /** 报表完整路径：<provider>:<path>，'*' 代表全部 */
    private String filePath;
}
