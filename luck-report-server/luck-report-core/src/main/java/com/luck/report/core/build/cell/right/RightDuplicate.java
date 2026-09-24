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
package com.luck.report.core.build.cell.right;

import com.luck.report.core.build.Context;
import com.luck.report.core.model.Cell;
import com.luck.report.core.model.Column;
import com.luck.report.core.model.Report;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * @author Jacky.gao
 * @since 2016年11月10日
 */
public class RightDuplicate {
    private int index;
    private int columnSize;
    private Context context;
    private Cell mainCell;
    private int minColNumber = -1;
    private Map<Column, Column> colMap = new HashMap<Column, Column>();
    private List<Column> newColList = new ArrayList<Column>();

    public RightDuplicate(Cell mainCell, int columnSize, Context context) {
        this.mainCell = mainCell;
        this.columnSize = columnSize;
        this.context = context;
    }

    public Column newColumn(Column col, int colNumber) {
        if (colMap.containsKey(col)) {
            return colMap.get(col);
        } else {
            Column newCol = col.newColumn();
            colNumber = colNumber + columnSize * (index - 1) + columnSize;
            if (minColNumber == -1 || minColNumber > colNumber) {
                minColNumber = colNumber;
            }
            newCol.setTempColumnNumber(colNumber);
            newColList.add(newCol);
            colMap.put(col, newCol);
            return newCol;
        }
    }

    public int getColSize() {
        return columnSize;
    }

    public void setIndex(int index) {
        this.index = index;
    }

    public Context getContext() {
        return context;
    }

    public Cell getMainCell() {
        return mainCell;
    }

    public void complete() {
        if (minColNumber < 1) {
            return;
        }
        Report report = context.getReport();
        // duplicate 会先建子列再建父列，newColList 追加顺序与 tempColumnNumber 不一致；
        // 插入前必须按 tempColumnNumber 排序，与 DownDuplicate 按 tempRowNumber 排序对称。
        Collections.sort(newColList, new Comparator<Column>() {
            @Override
            public int compare(Column o1, Column o2) {
                return o1.getTempColumnNumber() - o2.getTempColumnNumber();
            }
        });
        report.insertColumns(minColNumber, newColList);
    }

    public void reset() {
        colMap.clear();
    }
}
