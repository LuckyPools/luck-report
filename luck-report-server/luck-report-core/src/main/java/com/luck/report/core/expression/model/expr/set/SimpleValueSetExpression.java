/*******************************************************************************
 * Copyright 2017 Bstek
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License.  You may obtain a copy
 * of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
 * License for the specific language governing permissions and limitations under
 * the License.
 ******************************************************************************/
package com.luck.report.core.expression.model.expr.set;

import com.luck.report.core.build.Context;
import com.luck.report.core.expression.model.data.ExpressionData;
import com.luck.report.core.expression.model.data.ObjectExpressionData;
import com.luck.report.core.expression.model.expr.BaseExpression;
import com.luck.report.core.model.Cell;

/**
 * @author Jacky.gao
 * @since 2017年1月1日
 */
public class SimpleValueSetExpression extends BaseExpression {
    private static final long serialVersionUID = 1L;
    private Object simpleValue;

    public SimpleValueSetExpression() {}

    public SimpleValueSetExpression(Object simpleValue) {
        this.simpleValue = simpleValue;
    }

    @Override
    protected ExpressionData<?> compute(Cell cell, Cell currentCell, Context context) {
        return new ObjectExpressionData(simpleValue);
    }

    /**
     * 获取简单值
     * @return 简单值
     */
    public Object getSimpleValue() {
        return simpleValue;
    }

    /**
     * 设置简单值
     * @param simpleValue 简单值
     */
    public void setSimpleValue(Object simpleValue) {
        this.simpleValue = simpleValue;
    }
}
