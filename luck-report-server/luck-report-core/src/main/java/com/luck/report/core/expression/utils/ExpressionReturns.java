package com.luck.report.core.expression.utils;

import com.luck.report.core.expression.model.data.ExpressionData;
import com.luck.report.core.expression.model.data.ReturnedExpressionData;

public final class ExpressionReturns {
    private ExpressionReturns() {}

    public static ExpressionData<?> unwrap(ExpressionData<?> data) {
        if (data instanceof ReturnedExpressionData) {
            return ((ReturnedExpressionData) data).unwrap();
        }
        return data;
    }
}
