package com.luck.report.agent.modules.datasource.handler;

import com.luck.report.agent.modules.datasource.domain.dto.ColumnDTO;
import com.luck.report.agent.modules.datasource.domain.dto.SchemaDTO;
import com.luck.report.agent.modules.datasource.domain.dto.TableDTO;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

/**
 * 数据源Schema提示词格式化工具
 * 将SchemaDTO序列化为LLM可读的结构化文本，供Agent拼接system prompt使用
 *
 * 输出格式示例：
 * 【DB_ID】 mydb
 * # Table: t_order, 订单表
 * [
 * (order_id:INT, 订单ID, Primary Key),
 * (buyer_uid:INT, 买家ID, Examples: [1,2,3]),
 * (total_amount:DECIMAL, 订单总金额)
 * ]
 * 【Foreign keys】
 * t_order.buyer_uid=t_user.id
 *
 * @author luck
 */
public class DatasourcePromptHelper {

    /**
     * 将SchemaDTO格式化为LLM可读的提示词文本
     * 包含表结构（字段名、类型、注释、主键、示例值）和外键关系
     *
     * @param schemaDTO Schema数据载体
     * @return 格式化后的提示词文本
     */
    public static String buildSchemaPrompt(SchemaDTO schemaDTO) {
        return buildSchemaPrompt(schemaDTO, true);
    }

    /**
     * 将SchemaDTO格式化为LLM可读的提示词文本
     *
     * @param schemaDTO     Schema数据载体
     * @param withColumnType 是否包含字段类型
     * @return 格式化后的提示词文本
     */
    public static String buildSchemaPrompt(SchemaDTO schemaDTO, boolean withColumnType) {
        StringBuilder sb = new StringBuilder();
        sb.append("【DB_ID】 ").append(StringUtils.defaultString(schemaDTO.getName(), "")).append("\n");

        if (CollectionUtils.isNotEmpty(schemaDTO.getTable())) {
            for (TableDTO tableDTO : schemaDTO.getTable()) {
                sb.append(buildTablePrompt(tableDTO, withColumnType)).append("\n");
            }
        }

        if (CollectionUtils.isNotEmpty(schemaDTO.getForeignKeys())) {
            sb.append("【Foreign keys】\n").append(String.join("\n", schemaDTO.getForeignKeys()));
        }

        return sb.toString();
    }

    /**
     * 将单张表格式化为提示词文本
     *
     * @param tableDTO      表信息
     * @param withColumnType 是否包含字段类型
     * @return 格式化后的表结构文本
     */
    private static String buildTablePrompt(TableDTO tableDTO, boolean withColumnType) {
        StringBuilder sb = new StringBuilder();
        sb.append("# Table: ").append(tableDTO.getName());

        // 表注释：仅当注释与表名不同时才追加，避免重复
        if (!StringUtils.equals(tableDTO.getName(), tableDTO.getDescription())
                && StringUtils.isNotBlank(tableDTO.getDescription())) {
            sb.append(", ").append(tableDTO.getDescription());
        }
        sb.append("\n");

        sb.append("[\n");
        List<String> columnLines = new ArrayList<>();
        if (CollectionUtils.isNotEmpty(tableDTO.getColumn())) {
            for (ColumnDTO columnDTO : tableDTO.getColumn()) {
                columnLines.add(buildColumnPrompt(columnDTO, tableDTO, withColumnType));
            }
        }
        sb.append(String.join(",\n", columnLines));
        sb.append("\n]");

        return sb.toString();
    }

    /**
     * 将单个字段格式化为提示词文本
     *
     * @param columnDTO     字段信息
     * @param tableDTO      所属表信息（用于判断主键）
     * @param withColumnType 是否包含字段类型
     * @return 格式化后的字段文本
     */
    private static String buildColumnPrompt(ColumnDTO columnDTO, TableDTO tableDTO, boolean withColumnType) {
        StringBuilder line = new StringBuilder();
        line.append("(").append(columnDTO.getName());

        // 字段类型
        if (withColumnType && StringUtils.isNotBlank(columnDTO.getType())) {
            line.append(":").append(columnDTO.getType().toUpperCase(Locale.ROOT));
        }

        // 字段注释：仅当注释与字段名不同时才追加
        if (!StringUtils.equals(columnDTO.getName(), columnDTO.getDescription())
                && StringUtils.isNotBlank(columnDTO.getDescription())) {
            line.append(", ").append(columnDTO.getDescription());
        }

        // 主键标记
        if (CollectionUtils.isNotEmpty(tableDTO.getPrimaryKeys())
                && tableDTO.getPrimaryKeys().contains(columnDTO.getName())) {
            line.append(", Primary Key");
        }

        // 示例数据（id字段不展示示例）
        List<String> enumData = Optional.ofNullable(columnDTO.getData())
                .orElse(new ArrayList<>())
                .stream()
                .filter(StringUtils::isNotEmpty)
                .collect(java.util.stream.Collectors.toList());

        if (CollectionUtils.isNotEmpty(enumData) && !"id".equalsIgnoreCase(columnDTO.getName())) {
            List<String> displayData = new ArrayList<>(enumData.subList(0, Math.min(3, enumData.size())));
            line.append(", Examples: [").append(String.join(",", displayData)).append("]");
        }

        line.append(")");
        return line.toString();
    }
}
