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
import com.luck.report.core.expression.model.Condition;
import com.luck.report.core.expression.model.data.ExpressionData;
import com.luck.report.core.expression.model.data.ObjectExpressionData;
import com.luck.report.core.expression.model.data.ObjectListExpressionData;
import com.luck.report.core.model.Cell;

import java.util.ArrayList;
import java.util.List;

/**
 * @author Jacky.gao
 * @since 2017年4月6日
 */
public class WholeCellExpression extends CellExpression {
    private static final long serialVersionUID = 1L;
    private Condition condition;

    public WholeCellExpression() {
        super(null);
    }

    public WholeCellExpression(String cellName) {
        super(cellName);
    }

    @Override
    public boolean supportPaging() {
        return false;
    }

    @Override
    protected ExpressionData<?> compute(Cell cell, Cell currentCell, Context context) {
        while (!context.isCellPocessed(cellName)) {
            context.getReportBuilder().buildCell(context, null);
        }
        List<Cell> cells = context.getReport().getCellsMap().get(cellName);
        List<Object> list = new ArrayList<Object>();
        for (Cell c : cells) {
            Object obj = c.getData();
            if (condition != null) {
                boolean result = condition.filter(cell, currentCell, obj, context);
                if (!result) {
                    continue;
                }
            }
            list.add(obj);
        }
        if (list.size() == 1) {
            return new ObjectExpressionData(list.get(0));
        } else {
            return new ObjectListExpressionData(list);
        }
    }

    /**
     * 获取条件
     * @return 条件
     */
    public Condition getCondition() {
        return condition;
    }

    public void setCondition(Condition condition) {
        this.condition = condition;
    }
}
