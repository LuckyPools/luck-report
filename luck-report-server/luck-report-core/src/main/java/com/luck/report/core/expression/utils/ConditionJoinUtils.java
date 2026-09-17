package com.luck.report.core.expression.utils;

import com.luck.report.core.expression.model.condition.Join;

import java.util.List;

/**
 * 多条件 and/or 组合求值工具。
 */
public final class ConditionJoinUtils {

    private ConditionJoinUtils() {
    }

    /**
     * 按 and 优先于 or 计算多条件组合结果，如 {@code A and B or C} ⇒ {@code (A and B) or C}。
     *
     * @param values 各原子条件的布尔结果
     * @param joins  相邻条件间的连接符（长度一般为 values.size()-1）
     * @return 组合后的最终结果；values 为空时返回 false
     */
    public static boolean computeJoinResult(List<Boolean> values, List<Join> joins) {
        if (values == null || values.isEmpty()) {
            return false;
        }
        if (joins == null || joins.isEmpty() || values.size() == 1) {
            return values.get(0);
        }
        boolean andGroup = values.get(0);
        int joinCount = Math.min(joins.size(), values.size() - 1);
        for (int i = 0; i < joinCount; i++) {
            boolean next = values.get(i + 1);
            if (joins.get(i) == Join.and) {
                andGroup = andGroup && next;
            } else {
                if (andGroup) {
                    return true;
                }
                andGroup = next;
            }
        }
        return andGroup;
    }
}
