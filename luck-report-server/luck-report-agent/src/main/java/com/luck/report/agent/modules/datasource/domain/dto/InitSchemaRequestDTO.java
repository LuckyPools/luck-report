package com.luck.report.agent.modules.datasource.domain.dto;

import lombok.Data;

import java.util.List;

/**
 * 初始化表Schema请求DTO
 * 指定需要将哪些表的Schema信息存入向量数据库
 *
 * @author luck
 */
@Data
public class InitSchemaRequestDTO {

    /** 需要初始化的表名列表 */
    private List<String> tables;

    /** 嵌入模型配置ID，用于指定向量化时使用的嵌入模型 */
    private Long modelId;
}
