package com.luck.report.agent.modules.datasource.domain.vo;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDateTime;

/**
 * 数据源视图对象
 * 返回给前端的数据源信息，隐藏敏感字段
 *
 * @author luck
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DatasourceVO {

    /** 主键ID */
    private Integer id;

    /** 数据源名称 */
    private String name;

    /** 数据源类型 */
    private String type;

    /** 主机地址 */
    private String host;

    /** 端口号 */
    private Integer port;

    /** 数据库名 */
    private String databaseName;

    /** 用户名 */
    private String username;

    /** 密码（仅写入时使用，查询时不返回） */
    private String password;

    /** 完整JDBC连接URL */
    private String connectionUrl;

    /** 状态：active/inactive */
    private String status;

    /** 连接测试状态：success/failed/unknown */
    private String testStatus;

    /** 描述 */
    private String description;

    /** 创建人ID */
    private Long creatorId;

    /** 创建时间 */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createTime;

    /** 更新时间 */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updateTime;
}
