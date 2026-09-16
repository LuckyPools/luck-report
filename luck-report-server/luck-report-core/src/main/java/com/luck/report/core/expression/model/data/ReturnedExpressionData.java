package com.luck.report.core.expression.model.data;

import java.io.Serializable;

public class ReturnedExpressionData implements ExpressionData<Object>, Serializable {
    private static final long serialVersionUID = 1L;
    private ExpressionData<?> inner;

    public ReturnedExpressionData() {}

    public ReturnedExpressionData(ExpressionData<?> inner) {
        this.inner = inner;
    }

    public ExpressionData<?> unwrap() {
        return inner;
    }

    @Override
    public Object getData() {
        return inner == null ? null : inner.getData();
    }

    public void setInner(ExpressionData<?> inner) {
        this.inner = inner;
    }

    public ExpressionData<?> getInner() {
        return inner;
    }
}
