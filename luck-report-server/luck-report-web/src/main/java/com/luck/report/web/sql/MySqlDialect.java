package com.luck.report.web.sql;

import com.luck.report.web.sql.enums.DbType;

/**
 * mysql 数据库 分页语句组装
 * Since: 2016-01-23
 * @author hubin
 */
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
}
