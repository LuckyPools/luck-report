package com.luck.report.web.sql;

import com.luck.report.web.sql.enums.DbType;
import org.springframework.stereotype.Component;

/**
 * mysql 数据库 分页语句组装
 * Since: 2016-01-23
 * @author hubin
 */
@Component
public class MySqlDialect implements IPageDialect {

    /**
     * 获取数据库类型
     *
     * @return
     */
    @Override
    public DbType getDbType() {
        return DbType.MYSQL;
    }

    @Override
    public String buildPaginationSql(String originalSql, long offset, long limit) {
        StringBuilder sql = new StringBuilder("SELECT * FROM (")
                .append(originalSql)
                .append(") AS tmp LIMIT ");
        if (offset != 0L) {
            sql.append(offset).append(",").append(limit);
        } else {
            sql.append(limit);
        }
        return sql.toString();
    }

    /**
     * 构建统计总数的SQL语句
     *
     * @param originalSql 原始SQL语句，不能为空
     * @return 统计总数的SQL语句
     */
    @Override
    public String buildCountSql(String originalSql) {
        return "SELECT COUNT(*) FROM (" + originalSql + ") tmp";
    }
}
