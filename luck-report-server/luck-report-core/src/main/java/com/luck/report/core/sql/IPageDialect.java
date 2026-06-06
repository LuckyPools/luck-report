package com.luck.report.core.sql;

import com.luck.report.core.sql.enums.DbType;

/**
 * 数据库 分页语句组装接口
 * Since: 2016-01-23
 * @author hubin
 */
public interface IPageDialect {

    /**
     * 获取数据库类型
     * @return
     */
    DbType getDbType();

    /**
     * 组装分页语句
     *
     * @param originalSql 原始语句
     * @param offset      偏移量
     * @param limit       界限
     * @return 分页模型
     */
    String buildPaginationSql(String originalSql, long offset, long limit);

    /**
     * 构建统计总数的SQL语句
     * 将原始SQL包装为 SELECT COUNT(*) FROM (原始SQL) tmp 形式
     *
     * @param originalSql 原始SQL语句，不能为空
     * @return 统计总数的SQL语句
     */
    String buildCountSql(String originalSql);
}
