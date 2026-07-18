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

import com.luck.report.core.Utils;
import com.luck.report.core.build.Context;
import com.luck.report.core.expression.model.Condition;
import com.luck.report.core.expression.model.data.ExpressionData;
import com.luck.report.core.expression.model.data.NoneExpressionData;
import com.luck.report.core.expression.model.data.ObjectExpressionData;
import com.luck.report.core.expression.model.data.ObjectListExpressionData;
import com.luck.report.core.model.Cell;

import java.util.ArrayList;
import java.util.List;

/**
 * @author Jacky.gao
 * @since 2017年1月1日
 */
public class CellConditionExpression extends CellExpression {
    private static final long serialVersionUID = 1L;
    protected Condition condition;

    public CellConditionExpression() {
        super(null);
    }

    public CellConditionExpression(String cellName, Condition condition) {
        super(cellName);
        this.condition = condition;
    }

    @Override
    protected ExpressionData<?> compute(Cell cell, Cell currentCell, Context context) {
        List<Cell> targetCells = Utils.fetchTargetCells(cell, context, cellName);
        targetCells = filterCells(cell, context, condition, targetCells);
        if (targetCells.size() > 1) {
            List<Object> list = new ArrayList<Object>();
            for (Cell targetCell : targetCells) {
                list.add(targetCell.getData());
            }
            return new ObjectListExpressionData(list);
        } else if (targetCells.size() == 1) {
            return new ObjectExpressionData(targetCells.get(0).getData());
        } else {
            return new NoneExpressionData();
        }
    }

    @Override
    public ExpressionData<?> computePageCells(Cell cell, Cell currentCell, Context context) {
        List<Cell> targetCells = fetchPageCells(cell, currentCell, context);
        targetCells = filterCells(cell, context, condition, targetCells);
        if (targetCells.size() > 1) {
            List<Object> list = new ArrayList<Object>();
            for (Cell targetCell : targetCells) {
                list.add(targetCell.getData());
            }
            return new ObjectListExpressionData(list);
        } else if (targetCells.size() == 1) {
            return new ObjectExpressionData(targetCells.get(0).getData());
        } else {
            return new NoneExpressionData();
        }
    }

    /**
     * 获取条件
     * @return 条件
     */
    public Condition getCondition() {
        return condition;
    }

    /**
     * 设置条件
     * @param condition 条件
     */
    public void setCondition(Condition condition) {
        this.condition = condition;
    }

    @Override
    public List<String> fetchCellName() {
        List<String> list = new ArrayList<String>();
        if (cellName != null && !cellName.isEmpty()) {
            list.add(cellName);
        }
        if (condition != null) {
            list.addAll(condition.fetchCellName());
        }
        return list;
    }
}
