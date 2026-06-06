package com.luck.report.core.sql;

import com.luck.report.core.sql.enums.DbType;
import org.springframework.stereotype.Component;

/**
 * PostgreSQL 数据库分页语句组装
 * 使用 LIMIT/OFFSET 语法实现分页
 *
 * @author luck
 */
@Component
public class PostgreSqlDialect implements IPageDialect {

    /**
     * 获取数据库类型
     *
     * @return PostgreSQL 数据库类型枚举
     */
    @Override
    public DbType getDbType() {
        return DbType.POSTGRE_SQL;
    }

    /**
     * 组装 PostgreSQL 分页语句
     * 使用 LIMIT ... OFFSET ... 语法，与 MySQL 的 LIMIT offset,limit 语法不同
     *
     * @param originalSql 原始SQL语句
     * @param offset      偏移量（跳过的行数）
     * @param limit       每页条数
     * @return 拼接了分页语句的SQL
     */
    @Override
    public String buildPaginationSql(String originalSql, long offset, long limit) {
        StringBuilder sql = new StringBuilder(originalSql)
                .append(" LIMIT ").append(limit)
                .append(" OFFSET ").append(offset);
        return sql.toString();
    }

    /**
     * 构建统计总数的SQL语句
     * 将原始SQL包装为 SELECT COUNT(*) FROM (原始SQL) tmp 形式
     *
     * @param originalSql 原始SQL语句，不能为空
     * @return 统计总数的SQL语句
     */
    @Override
    public String buildCountSql(String originalSql) {
        return "SELECT COUNT(*) FROM (" + originalSql + ") tmp";
    }
}
