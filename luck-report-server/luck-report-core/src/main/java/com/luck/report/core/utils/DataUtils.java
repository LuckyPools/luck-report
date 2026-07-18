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
package com.luck.report.core.utils;

import com.luck.report.core.build.Context;
import com.luck.report.core.definition.Expand;
import com.luck.report.core.definition.value.DatasetValue;
import com.luck.report.core.definition.value.ExpressionValue;
import com.luck.report.core.definition.value.Value;
import com.luck.report.core.expression.model.Expression;
import com.luck.report.core.expression.model.expr.BaseExpression;
import com.luck.report.core.expression.model.expr.JoinExpression;
import com.luck.report.core.expression.model.expr.ParenExpression;
import com.luck.report.core.expression.model.expr.dataset.DatasetExpression;
import com.luck.report.core.model.Cell;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * @author Jacky.gao
 * @since 2017年6月12日
 */
public class DataUtils {
    public static List<?> fetchData(Cell cell, Context context, String datasetName) {
        Cell leftCell = fetchLeftCell(cell, context, datasetName);
        Cell topCell = fetchTopCell(cell, context, datasetName);
        List<Object> leftList = null, topList = null;
        if (leftCell != null) {
            leftList = leftCell.getBindData();
        }
        if (topCell != null) {
            topList = topCell.getBindData();
        }
        if (leftList != null && topList != null) {
            List<Object> data = new ArrayList<Object>();
            List<Object> biggerList = null;
            List<Object> smallerList = null;
            if (leftList.size() > topList.size()) {
                biggerList = leftList;
                smallerList = topList;
            } else {
                biggerList = topList;
                smallerList = leftList;
            }
            Set<Object> set = new HashSet<Object>();
            for (Object object : smallerList) {
                set.add(object);
            }
            for (Object object : biggerList) {
                if (set.contains(object)) {
                    data.add(object);
                }
            }
            return data;
        }
        if (leftList != null) {
            return leftList;
        }
        if (topList != null) {
            return topList;
        }
        return context.getDatasetData(datasetName);
    }

    public static Cell fetchLeftCell(Cell cell, Context context, String datasetName) {
        Cell leftCell = cell.getLeftParentCell();
        if (leftCell != null) {
            if (Expand.Down.equals(leftCell.getExpand())) {
                Value leftCellValue = leftCell.getValue();
                DatasetExpression leftDSValue = fetchDatasetExpression(leftCellValue);
                if (leftDSValue != null) {
                    String leftDatasetName = leftDSValue.getDatasetName();
                    if (leftDatasetName.equals(datasetName)) {
                        return leftCell;
                    }
                }
            }
            return fetchLeftCell(leftCell, context, datasetName);
        }
        return null;
    }

    public static Cell fetchTopCell(Cell cell, Context context, String datasetName) {
        Cell topCell = cell.getTopParentCell();
        if (topCell != null) {
            if (Expand.Right.equals(topCell.getExpand())) {
                Value topCellValue = topCell.getValue();
                DatasetExpression leftDSValue = fetchDatasetExpression(topCellValue);
                if (leftDSValue != null) {
                    String leftDatasetName = leftDSValue.getDatasetName();
                    if (leftDatasetName.equals(datasetName)) {
                        return topCell;
                    }
                }
            }
            return fetchTopCell(topCell, context, datasetName);
        }
        return null;
    }

    public static DatasetExpression fetchDatasetExpression(Value value) {
        if (value instanceof ExpressionValue) {
            ExpressionValue exprValue = (ExpressionValue) value;
            Expression expr = exprValue.getExpression();
            if (expr instanceof DatasetExpression) {
                return (DatasetExpression) expr;
            } else if (expr instanceof ParenExpression) {
                ParenExpression parenExpr = (ParenExpression) expr;
                DatasetExpression targetExpr = buildDatasetExpression(parenExpr);
                return targetExpr;
            } else {
                return null;
            }
        } else if (value instanceof DatasetValue) {
            return (DatasetValue) value;
        }
        return null;
    }

    private static DatasetExpression buildDatasetExpression(JoinExpression joinExpr) {
        List<BaseExpression> expressions = joinExpr.getExpressions();
        for (BaseExpression baseExpr : expressions) {
            if (baseExpr instanceof DatasetExpression) {
                return (DatasetExpression) baseExpr;
            } else if (baseExpr instanceof JoinExpression) {
                JoinExpression childExpr = (JoinExpression) baseExpr;
                return buildDatasetExpression(childExpr);
            }
        }
        return null;
    }
}
