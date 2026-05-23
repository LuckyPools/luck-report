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

import com.luck.report.core.Utils;
import com.luck.report.core.build.Context;
import com.luck.report.core.expression.ExpressionUtils;
import com.luck.report.core.expression.model.Expression;
import com.luck.report.core.expression.model.data.ExpressionData;
import com.luck.report.core.model.Cell;
import org.apache.commons.lang3.StringUtils;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.ArrayList;
import java.util.List;

/**
 * @author Jacky.gao
 * @since 2016年11月22日
 */
public class PropertyExpressionCondition extends BaseCondition {
    private static final long serialVersionUID = 1L;
    private ConditionType type = ConditionType.property;
    @JsonIgnore // 内部重构 left
    private String leftProperty;
    @JsonIgnore // 内部重构 right
    private Expression rightExpression;

    public PropertyExpressionCondition() {}

    @Override
    Object computeLeft(Cell cell, Cell currentCell, Object obj, Context context) {
        if (StringUtils.isNotBlank(leftProperty)) {
            return Utils.getProperty(obj, leftProperty);
        } else {
            return cell.getData();
        }
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
     * @param type 条件类型
     */
    public void setType(ConditionType type) {
    }

    public String getLeftProperty() {
        return leftProperty;
    }

    public void setLeftProperty(String leftProperty) {
        this.leftProperty = leftProperty;
    }

    public Expression getRightExpression() {
        return rightExpression;
    }

    public void setRightExpression(Expression rightExpression) {
        this.rightExpression = rightExpression;
    }

    /**
     * 重写父类方法，设置左侧属性值的同时自动重构派生字段leftProperty
     * @param left 左侧属性字符串
     */
    @Override
    public void setLeft(String left) {
        super.setLeft(left);
        this.leftProperty = left;
    }

    /**
     * 重写父类方法，设置右侧表达式字符串的同时自动解析并重构派生字段rightExpression
     * @param right 右侧表达式字符串
     */
    @Override
    public void setRight(String right) {
        super.setRight(right);
        if (StringUtils.isNotBlank(right)) {
            this.rightExpression = ExpressionUtils.parseExpression(right);
        }
    }

    @Override
    public List<String> fetchCellName() {
        List<String> list = new ArrayList<String>();
        if (rightExpression != null) {
            list.addAll(rightExpression.fetchCellName());
        }
        list.addAll(super.fetchCellName());
        return list;
    }
}
