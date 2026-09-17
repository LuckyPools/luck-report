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

import com.luck.report.core.build.BindData;
import com.luck.report.core.build.Context;
import com.luck.report.core.expression.ExpressionUtils;
import com.luck.report.core.expression.model.Condition;
import com.luck.report.core.expression.model.Op;
import com.luck.report.core.expression.model.data.*;
import com.luck.report.core.expression.utils.ExpressionReturns;
import com.luck.report.core.expression.utils.ConditionJoinUtils;
import com.luck.report.core.model.Cell;

import java.util.ArrayList;
import java.util.List;

/**
 * @author Jacky.gao
 * @since 2016年11月22日
 */
public abstract class BaseCondition implements Condition {
    private static final long serialVersionUID = 1L;
    protected Op op;
    private String operation;
    private Join join;
    /**
     *  与下一项的关联符
     */
    private Join nextJoin;
    private Condition nextCondition;
    private String left;
    private String right;

    @Override
    public final boolean filter(Cell cell, Cell currentCell, Object obj, Context context) {
        List<Boolean> values = new ArrayList<>();
        List<Join> joins = new ArrayList<>();
        BaseCondition node = this;
        while (true) {
            Object leftVal = node.computeLeft(cell, currentCell, obj, context);
            Object rightVal = node.computeRight(cell, currentCell, obj, context);
            values.add(ExpressionUtils.conditionEval(node.op, leftVal, rightVal));
            if (node.nextJoin != null && node.nextCondition instanceof BaseCondition) {
                joins.add(node.nextJoin);
                node = (BaseCondition) node.nextCondition;
            } else {
                break;
            }
        }
        return ConditionJoinUtils.computeJoinResult(values, joins);
    }

    abstract Object computeLeft(Cell cell, Cell currentCell, Object obj, Context context);

    abstract Object computeRight(Cell cell, Cell currentCell, Object obj, Context context);

    public abstract ConditionType getType();

    protected Object extractExpressionData(ExpressionData<?> data) {
        data = ExpressionReturns.unwrap(data);
        if (data instanceof ObjectExpressionData) {
            return data.getData();
        } else if (data instanceof ObjectListExpressionData) {
            ObjectListExpressionData listData = (ObjectListExpressionData) data;
            List<?> list = listData.getData();
            return list;
        } else if (data instanceof BindDataListExpressionData) {
            BindDataListExpressionData bindData = (BindDataListExpressionData) data;
            List<BindData> bindDataList = bindData.getData();
            List<Object> list = new ArrayList<Object>();
            for (BindData bd : bindDataList) {
                Object v = bd.getValue();
                list.add(v);
            }
            if (list.size() == 1) {
                return list.get(0);
            } else if (list.size() == 0) {
                return null;
            }
            return list;
        } else if (data instanceof NoneExpressionData) {
            return null;
        }
        return null;
    }

    public Op getOp() {
        return op;
    }

    public void setOp(Op op) {
        this.op = op;
    }

    public String getOperation() {
        return operation;
    }

    public void setOperation(String operation) {
        this.operation = operation;
    }

    public Condition getNextCondition() {
        return nextCondition;
    }

    public void setNextCondition(Condition nextCondition) {
        this.nextCondition = nextCondition;
    }

    public Join getJoin() {
        return join;
    }

    public void setJoin(Join join) {
        this.join = join;
    }

    public Join getNextJoin() {
        return nextJoin;
    }

    public void setNextJoin(Join nextJoin) {
        this.nextJoin = nextJoin;
    }

    public String getLeft() {
        return left;
    }

    public void setLeft(String left) {
        this.left = left;
    }

    public String getRight() {
        return right;
    }

    public void setRight(String right) {
        this.right = right;
    }

    /**
     * 默认实现递归处理 nextCondition 链。
     * 子类根据需要覆盖，并在覆盖方法中调用 super.fetchCellName()。
     */
    @Override
    public List<String> fetchCellName() {
        List<String> list = new ArrayList<String>();
        if (nextCondition != null) {
            list.addAll(nextCondition.fetchCellName());
        }
        return list;
    }
}
