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
package com.luck.report.core.expression.model.expr.ifelse;

import com.luck.report.core.build.BindData;
import com.luck.report.core.build.Context;
import com.luck.report.core.exception.ReportComputeException;
import com.luck.report.core.expression.ExpressionUtils;
import com.luck.report.core.expression.model.Expression;
import com.luck.report.core.expression.model.Op;
import com.luck.report.core.expression.model.data.*;
import com.luck.report.core.expression.model.data.*;
import com.luck.report.core.model.Cell;

import java.io.Serializable;
import java.util.List;

/**
 * @author Jacky.gao
 * @since 2017年1月16日
 */
public class ExpressionCondition implements Serializable {
    private static final long serialVersionUID = 1L;
    private Expression left;
    private Op op;
    private Expression right;

    public ExpressionCondition() {}

    public ExpressionCondition(Expression left, Op op, Expression right) {
        this.left = left;
        this.op = op;
        this.right = right;
    }

    public boolean eval(Context context, Cell cell, Cell currentCell) {
        ExpressionData<?> leftData = left.execute(cell, currentCell, context);
        ExpressionData<?> rightData = right.execute(cell, currentCell, context);
        Object leftObj = getData(leftData);
        Object rightObj = getData(rightData);
        return ExpressionUtils.conditionEval(op, leftObj, rightObj);
    }

    private Object getData(ExpressionData<?> data) {
        if (data instanceof ObjectExpressionData) {
            ObjectExpressionData objData = (ObjectExpressionData) data;
            return objData.getData();
        } else if (data instanceof ObjectListExpressionData) {
            ObjectListExpressionData exprData = (ObjectListExpressionData) data;
            List<?> list = exprData.getData();
            StringBuffer sb = new StringBuffer();
            for (Object obj : list) {
                if (sb.length() > 0) {
                    sb.append(",");
                }
                sb.append(obj);
            }
            return sb.toString();
        } else if (data instanceof NoneExpressionData) {
            return null;
        } else if (data instanceof BindDataListExpressionData) {
            BindDataListExpressionData bindDataList = (BindDataListExpressionData) data;
            List<BindData> list = bindDataList.getData();
            if (list.size() == 1) {
                return list.get(0).getValue();
            } else {
                StringBuffer sb = new StringBuffer();
                for (BindData bindData : list) {
                    if (sb.length() > 0) {
                        sb.append(",");
                    }
                    sb.append(bindData.getValue());
                }
                return sb.toString();
            }
        } else {
            throw new ReportComputeException("Unknow data : " + data);
        }
    }

    public Expression getLeft() {
        return left;
    }

    /**
     * 获取操作符
     * @return 操作符
     */
    public Op getOp() {
        return op;
    }

    public Expression getRight() {
        return right;
    }

    /**
     * 设置左侧表达式
     * @param left 左侧表达式
     */
    public void setLeft(Expression left) {
        this.left = left;
    }

    /**
     * 设置操作符
     * @param op 操作符
     */
    public void setOp(Op op) {
        this.op = op;
    }

    /**
     * 设置右侧表达式
     * @param right 右侧表达式
     */
    public void setRight(Expression right) {
        this.right = right;
    }
}
