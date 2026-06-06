package com.luck.report.core.sql;

import com.luck.report.core.sql.enums.DbType;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;

@Component
public class SQLServerDialect implements IPageDialect {
    public SQLServerDialect() {
    }

    /**
     * 获取数据库类型
     *
     * @return
     */
    @Override
    public DbType getDbType() {
        return DbType.SQL_SERVER;
    }

    private static String getOrderByPart(String sql) {
        String loweredString = sql.toLowerCase();
        int orderByIndex = loweredString.indexOf("order by");
        return orderByIndex != -1 ? sql.substring(orderByIndex) : "";
    }

    public String buildPaginationSql(String originalSql, long offset, long limit) {
        StringBuilder pagingBuilder = new StringBuilder();
        String orderby = getOrderByPart(originalSql);
        String distinctStr = "";
        String loweredString = originalSql.toLowerCase();
        String sqlPartString = originalSql;
        if (loweredString.trim().startsWith("select")) {
            int index = loweredString.indexOf("select") + 6;
            if (loweredString.trim().startsWith("select distinct")) {
                distinctStr = "DISTINCT ";
                index = loweredString.indexOf("select distinct") + 15;
            }

            sqlPartString = originalSql.substring(index);
        }

        pagingBuilder.append(sqlPartString);
        if (StringUtils.isBlank(orderby)) {
            orderby = "ORDER BY CURRENT_TIMESTAMP";
        }

        long firstParam = offset + 1L;
        long secondParam = offset + limit;
        String sql = "WITH selectTemp AS (SELECT " + distinctStr + "TOP 100 PERCENT  ROW_NUMBER() OVER (" + orderby + ") as __row_number__, " + pagingBuilder + ") SELECT * FROM selectTemp WHERE __row_number__ BETWEEN " + firstParam + " AND " + secondParam + " ORDER BY __row_number__";
        return sql;
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
