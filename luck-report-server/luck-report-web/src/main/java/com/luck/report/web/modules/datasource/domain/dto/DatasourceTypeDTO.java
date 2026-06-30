package com.luck.report.web.modules.datasource.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 数据源类型DTO
 * 用于返回前端展示的数据源类型信息
 *
 * @author luck
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DatasourceTypeDTO {

    /** 类型编码 */
    private Integer code;

    /** 类型标识名（用于后端识别） */
    private String typeName;

    /** 显示名称（用于前端展示） */
    private String displayName;

    /** JDBC驱动类名 */
    private String driverClassName;
}
