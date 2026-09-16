package com.luck.report.core.expression.model.expr;

import com.luck.report.core.build.Context;
import com.luck.report.core.expression.model.Expression;
import com.luck.report.core.expression.model.data.ExpressionData;
import com.luck.report.core.expression.model.data.ReturnedExpressionData;
import com.luck.report.core.model.Cell;

import java.util.ArrayList;
import java.util.List;

public class ReturnExpression extends BaseExpression {
    private static final long serialVersionUID = 1L;
    private Expression expression;

    public ReturnExpression() {}

    @Override
    protected ExpressionData<?> compute(Cell cell, Cell currentCell, Context context) {
        ExpressionData<?> data = expression.execute(cell, currentCell, context);
        if (data instanceof ReturnedExpressionData) {
            return data;
        }
        return new ReturnedExpressionData(data);
    }

    public Expression getExpression() {
        return expression;
    }

    public void setExpression(Expression expression) {
        this.expression = expression;
    }

    @Override
    public List<String> fetchCellName() {
        List<String> list = new ArrayList<String>();
        if (expression != null) {
            list.addAll(expression.fetchCellName());
        }
        return list;
    }
}
