package com.luck.report.core.utils;

import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * SQL参数占位符工具类
 * 负责将 #{paramName} 格式转换为 NamedParameterJdbcTemplate 所需的 :paramName 格式
 *
 * @author luck
 */
public class SqlParamUtils {

    /**
     * SQL参数占位符正则：匹配 #{paramName}
     * 参数名支持：中文、英文、数字、下划线，且不以数字开头
     * 与 NamedParameterJdbcTemplate 的参数名边界规则一致（非分隔符即合法）
     */
    private static final Pattern PARAM_PATTERN = Pattern.compile("#\\{([\\p{L}_][\\p{L}\\p{N}_]*)\\}");

    /**
     * 方法说明：将SQL中的 #{paramName} 占位符转换为 :paramName
     * 转换后适配 Spring NamedParameterJdbcTemplate 的原生语法。
     * 已有的 :paramName 不受影响，兼容旧版报表。
     *
     * @param sql 原始SQL，使用 #{xxx} 占位符，可为null
     * @return 转换后的SQL，使用 :xxx 占位符；null输入返回null
     */
    public static String convertToNamedParam(String sql) {
        if (sql == null) {
            return null;
        }
        return PARAM_PATTERN.matcher(sql).replaceAll(":$1");
    }

    /**
     * 方法说明：从SQL中提取所有 #{paramName} 参数名
     * 参数名支持：中文、英文、数字、下划线
     *
     * @param sql 原始SQL，可为null
     * @param paramNameSet 提取结果存入此Set，不可为null
     */
    public static void extractParamNames(String sql, Set<String> paramNameSet) {
        if (sql == null) {
            return;
        }
        Matcher matcher = PARAM_PATTERN.matcher(sql);
        while (matcher.find()) {
            paramNameSet.add(matcher.group(1));
        }
    }
}
