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
import com.luck.report.core.expression.model.data.ExpressionData;
import com.luck.report.core.expression.model.data.NoneExpressionData;
import com.luck.report.core.expression.model.data.ObjectExpressionData;
import com.luck.report.core.expression.model.data.ObjectListExpressionData;
import com.luck.report.core.expression.model.expr.BaseExpression;
import com.luck.report.core.model.Cell;
import com.luck.report.core.model.Column;
import com.luck.report.core.model.Row;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * @author Jacky.gao
 * @since 2017年1月1日
 */
public class CellExpression extends BaseExpression {
    private static final long serialVersionUID = 1L;
    protected String cellName;

    public CellExpression() {}

    public CellExpression(String cellName) {
        this.cellName = cellName;
    }

    public boolean supportPaging() {
        return true;
    }
    @Override
    protected ExpressionData<?> compute(Cell cell, Cell currentCell, Context context) {
        List<Cell> targetCells = Utils.fetchTargetCells(cell, context, cellName);
        if (targetCells == null || targetCells.isEmpty()) {
            return new NoneExpressionData();
        }
        if (targetCells.size() == 1) {
            return new ObjectExpressionData(targetCells.get(0).getData());
        }
        if (targetCells.size() > 1) {
            List<Object> list = new ArrayList<Object>();
            for (Cell targetCell : targetCells) {
                list.add(targetCell.getData());
            }
            return new ObjectListExpressionData(list);
        }
        return new NoneExpressionData();
    }

    public ExpressionData<?> computePageCells(Cell cell, Cell currentCell, Context context) {
        int pageIndex = cell.getRow().getPageIndex();
        if (pageIndex == 0) pageIndex = 1;
        List<Row> pageRows = context.getCurrentPageRows(pageIndex);
        List<Object> list = new ArrayList<Object>();
        Map<Row, Map<Column, Cell>> cellMap = context.getReport().getRowColCellMap();
        List<Column> columns = context.getReport().getColumns();
        for (Row row : pageRows) {
            Map<Column, Cell> map = cellMap.get(row);
            if (map == null) {
                continue;
            }
            for (Column col : columns) {
                Cell targetCell = map.get(col);
                if (targetCell == null || !targetCell.getName().equals(cellName)) {
                    continue;
                }
                list.add(targetCell.getData());
            }
        }
        return new ObjectListExpressionData(list);
    }

    protected List<Cell> fetchPageCells(Cell cell, Cell currentCell, Context context) {
        int pageIndex = cell.getRow().getPageIndex();
        if (pageIndex == 0) pageIndex = 1;
        List<Row> pageRows = context.getCurrentPageRows(pageIndex);
        Map<Row, Map<Column, Cell>> cellMap = context.getReport().getRowColCellMap();
        List<Column> columns = context.getReport().getColumns();
        List<Cell> list = new ArrayList<Cell>();
        for (Row row : pageRows) {
            Map<Column, Cell> map = cellMap.get(row);
            if (map == null) {
                continue;
            }
            for (Column col : columns) {
                Cell targetCell = map.get(col);
                if (targetCell == null || !targetCell.getName().equals(cellName)) {
                    continue;
                }
                list.add(targetCell);
            }
        }
        return list;
    }

    /**
     * 获取单元格名称
     * @return 单元格名称
     */
    public String getCellName() {
        return cellName;
    }

    /**
     * 设置单元格名称
     * @param cellName 单元格名称
     */
    public void setCellName(String cellName) {
        this.cellName = cellName;
    }

    @Override
    public List<String> fetchCellName() {
        List<String> list = new ArrayList<String>();
        if (cellName != null && !cellName.isEmpty()) {
            list.add(cellName);
        }
        return list;
    }
}
