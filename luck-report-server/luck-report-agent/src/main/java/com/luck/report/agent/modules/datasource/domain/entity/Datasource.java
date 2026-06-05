package com.luck.report.agent.modules.datasource.domain.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDateTime;

/**
 * 数据源配置实体
 * 存储数据源连接信息，供agent查询和调用
 *
 * @author luck
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Datasource {

    /** 主键ID */
    private Integer id;

    /** 数据源名称 */
    private String name;

    /** 数据源类型：mysql/postgresql/oracle/dameng/sqlserver/hive */
    private String type;

    /** 主机地址 */
    private String host;

    /** 端口号 */
    private Integer port;

    /** 数据库名 */
    private String databaseName;

    /** 用户名 */
    private String username;

    /** 密码（序列化时隐藏） */
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    /** 完整JDBC连接URL */
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String connectionUrl;

    /** 状态：active/inactive */
    private String status;

    /** 连接测试状态：success/failed/unknown */
    private String testStatus;

    /** 描述 */
    private String description;

    /** 嵌入模型配置ID，用于指定向量化时使用的嵌入模型 */
    private Long modelId;

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
