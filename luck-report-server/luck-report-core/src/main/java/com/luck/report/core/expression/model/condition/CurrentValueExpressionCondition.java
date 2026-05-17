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
package com.luck.report.core.expression.model.condition;

import com.luck.report.core.build.Context;
import com.luck.report.core.expression.ExpressionUtils;
import com.luck.report.core.expression.model.Expression;
import com.luck.report.core.expression.model.data.ExpressionData;
import com.luck.report.core.model.Cell;
import com.fasterxml.jackson.annotation.JsonIgnore;

/**
 * @author Jacky.gao
 * @since 2017年12月8日
 */
public class CurrentValueExpressionCondition extends BaseCondition {
    private ConditionType type = ConditionType.current;
    @JsonIgnore // 内部重构 right
    private Expression rightExpression;

    public CurrentValueExpressionCondition() {}

    @Override
    Object computeLeft(Cell cell, Cell currentCell, Object obj, Context context) {
        return obj;
    }

    @Override
    Object computeRight(Cell cell, Cell currentCell, Object obj, Context context) {
        ExpressionData<?> exprData = rightExpression.execute(cell, currentCell, context);
        return extractExpressionData(exprData);
    }

    @Override
    public ConditionType getType() {
        return type;
    }

    /**
     * 空实现，用于兼容JSON反序列化时可能存在的type字段
     * @param type
     */
    public void setType(ConditionType type) {
        // 空实现，忽略type字段
    }

    public Expression getRightExpression() {
        return rightExpression;
    }

    public void setRightExpression(Expression rightExpression) {
        this.rightExpression = rightExpression;
    }

    /**
     * 重写父类方法，设置右侧表达式字符串并自动派生右侧Expression对象
     * @param right 右侧表达式字符串
     */
    @Override
    public void setRight(String right) {
        super.setRight(right);
        if (right != null && !right.isEmpty()) {
            this.rightExpression = ExpressionUtils.parseExpression(right);
        }
    }
}
