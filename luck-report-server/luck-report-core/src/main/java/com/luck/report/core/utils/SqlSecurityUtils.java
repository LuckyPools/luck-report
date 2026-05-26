package com.luck.report.core.utils;

import net.sf.jsqlparser.JSQLParserException;
import net.sf.jsqlparser.parser.CCJSqlParserUtil;
import net.sf.jsqlparser.statement.Statement;
import net.sf.jsqlparser.statement.select.Select;

/**
 * SQL安全验证工具类
 * 使用JSqlParser解析SQL语句，准确识别SQL类型，防止执行危险的DDL/DML语句
 *
 * @author luck-report
 * @since 2026年5月26日
 */
public class SqlSecurityUtils {

    /**
     * 验证SQL语句是否安全
     * 仅允许SELECT查询语句和存储过程调用(CALL)，禁止DELETE/UPDATE/INSERT/TRUNCATE等修改操作
     *
     * @param sql 待验证的SQL语句，不能为空
     * @throws SecurityException 当SQL语句包含不允许的操作时抛出
     */
    public static void validate(String sql) {
        if (sql == null || sql.trim().isEmpty()) {
            throw new SecurityException("SQL语句不能为空");
        }
        String trimmedSql = sql.trim();
        if (ProcedureUtils.isProcedure(trimmedSql)) {
            return;
        }

        try {
            Statement statement = CCJSqlParserUtil.parse(trimmedSql);
            if (statement instanceof Select) {
                return;
            }
            throw new JSQLParserException("不允许的SQL操作类型");
        } catch (JSQLParserException e) {
            validateByRegex(trimmedSql);
        }
    }

    /**
     * 使用正则表达式进行基础SQL安全验证
     * 作为JSqlParser解析失败时的后备方案
     *
     * @param sql 待验证的SQL语句
     * @throws SecurityException 当检测到危险SQL关键字时抛出
     */
    private static void validateByRegex(String sql) {
        String sqlWithoutStrings = removeStringLiterals(sql);
        String upperSql = sqlWithoutStrings.toUpperCase().trim();
        if (upperSql.startsWith("SELECT")) {
            return;
        }

        // 检查危险关键字
        String[] dangerousKeywords = {
            "DELETE", "DROP", "UPDATE", "INSERT",
            "TRUNCATE", "ALTER", "CREATE", "GRANT", "REVOKE"
        };

        for (String keyword : dangerousKeywords) {
            String pattern = "(^|\\s|;)" + keyword + "(\\s|;|$)";
            if (upperSql.matches(".*" + pattern + ".*")) {
                throw new SecurityException(
                    String.format("SQL语句包含不允许的操作: %s。", keyword)
                );
            }
        }
    }

    /**
     * 移除SQL中的字符串字面量，避免误判字符串值中的关键字
     * 例如: WHERE name = 'delete' 中的 delete 不会被误判
     *
     * @param sql 原始SQL语句
     * @return 移除字符串字面量后的SQL语句
     */
    private static String removeStringLiterals(String sql) {
        // 移除单引号字符串
        return sql.replaceAll("'[^']*'", "''");
    }
}
