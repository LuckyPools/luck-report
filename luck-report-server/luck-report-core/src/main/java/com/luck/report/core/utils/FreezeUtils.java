/*******************************************************************************
 * Copyright 2017 Bstek
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License.  You may obtain a copy
 * the License at
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

import com.luck.report.core.model.Cell;
import com.luck.report.core.model.Column;
import com.luck.report.core.model.Report;
import com.luck.report.core.model.Row;
import org.apache.commons.lang3.StringUtils;

import java.util.List;

/**
 * 冻结行列锚点解析工具
 * 将 Paper 上配置的"锚点单元格名"解析为物理行/列号，供 HTML/Excel 渲染冻结使用
 * 优先从展开后的 cellsMap 查找（支持展开后计算），找不到时 fallback 从锚点名直接解析行列号
 */
public class FreezeUtils {

    /**
     * 根据冻结行锚点单元格名，解析其物理行号（即冻结前 N 行的 N）
     * 优先从 cellsMap 查找（支持展开后计算），找不到时 fallback 从锚点名直接解析行号
     * @param report 展开后的报表对象，不可空
     * @param freezeRowCellName 冻结行锚点单元格名，可空（空返回0）
     * @return 冻结行数（1-based 行号）；锚点为空返回0
     */
    public static int resolveFreezeRowCount(Report report, String freezeRowCellName) {
        if (StringUtils.isBlank(freezeRowCellName)) {
            return 0;
        }
        List<Cell> cells = report.getCellsMap().get(freezeRowCellName);
        if (cells != null && !cells.isEmpty()) {
            // 展开后同名单元格可能有多个实例（向下展开），取 rowNumber 最小者作为冻结边界
            int minRowNumber = Integer.MAX_VALUE;
            for (Cell cell : cells) {
                int rowNumber = cell.getRow().getRowNumber();
                if (rowNumber < minRowNumber) {
                    minRowNumber = rowNumber;
                }
            }
            return minRowNumber;
        }
        return parseRowFromCellName(freezeRowCellName);
    }

    /**
     * 根据冻结列锚点单元格名，解析其物理列号（即冻结前 N 列的 N）
     * 优先从 cellsMap 查找（支持展开后计算），找不到时 fallback 从锚点名直接解析列号
     * @param report 展开后的报表对象，不可空
     * @param freezeColCellName 冻结列锚点单元格名，可空（空返回0）
     * @return 冻结列数（1-based 列号）；锚点为空返回0
     */
    public static int resolveFreezeColCount(Report report, String freezeColCellName) {
        if (StringUtils.isBlank(freezeColCellName)) {
            return 0;
        }
        List<Cell> cells = report.getCellsMap().get(freezeColCellName);
        if (cells != null && !cells.isEmpty()) {
            // 展开后同名单元格可能有多个实例（向右展开），取 columnNumber 最小者作为冻结边界
            int minColNumber = Integer.MAX_VALUE;
            for (Cell cell : cells) {
                int colNumber = cell.getColumn().getColumnNumber();
                if (colNumber < minColNumber) {
                    minColNumber = colNumber;
                }
            }
            return minColNumber;
        }
        return parseColFromCellName(freezeColCellName);
    }

    /**
     * 统计前 physicalCount 行中可见行数（realHeight>=1 且非 forPaging），用于 Excel 冻结行换算
     * @param rows 行列表，不可空
     * @param physicalCount 物理行数上限（1-based 行号）
     * @return 可见行数；physicalCount<=0 返回0
     */
    public static int countVisibleRows(List<Row> rows, int physicalCount) {
        if (physicalCount <= 0) {
            return 0;
        }
        int count = 0;
        int limit = Math.min(physicalCount, rows.size());
        for (int i = 0; i < limit; i++) {
            Row row = rows.get(i);
            // 遇到 forPaging 行终止，与 Excel 导出遍历的 return 语义保持一致
            if (row.isForPaging()) {
                break;
            }
            if (row.getRealHeight() >= 1) {
                count++;
            }
        }
        return count;
    }

    /**
     * 统计前 physicalCount 列中可见列数（width>=1），用于 Excel 冻结列换算
     * @param columns 列列表，不可空
     * @param physicalCount 物理列数上限（1-based 列号）
     * @return 可见列数；physicalCount<=0 返回0
     */
    public static int countVisibleCols(List<Column> columns, int physicalCount) {
        if (physicalCount <= 0) {
            return 0;
        }
        int count = 0;
        int limit = Math.min(physicalCount, columns.size());
        for (int i = 0; i < limit; i++) {
            if (columns.get(i).getWidth() >= 1) {
                count++;
            }
        }
        return count;
    }

    /**
     * 从单元格名中解析行号（提取末尾数字，如 "A3" → 3）
     * @param cellName 单元格名，不可空
     * @return 行号；无数字返回0
     */
    private static int parseRowFromCellName(String cellName) {
        String rowStr = cellName.replaceAll("[^0-9]", "");
        if (rowStr.isEmpty()) {
            return 0;
        }
        return Integer.parseInt(rowStr);
    }

    /**
     * 从单元格名中解析列号（提取开头字母转列号，如 "C1" → 3）
     * @param cellName 单元格名，不可空
     * @return 列号；无字母返回0
     */
    private static int parseColFromCellName(String cellName) {
        StringBuilder letters = new StringBuilder();
        for (int i = 0; i < cellName.length(); i++) {
            char c = cellName.charAt(i);
            if (Character.isLetter(c)) {
                letters.append(c);
            } else {
                break;
            }
        }
        if (letters.length() == 0) {
            return 0;
        }
        return lettersToColNumber(letters.toString());
    }

    /**
     * 列字母转列号（1-based），Excel 标准 26 进制（A=1, Z=26, AA=27）
     * @param letters 列字母（如 "A"、"AB"），不可空
     * @return 列号；空返回0
     */
    private static int lettersToColNumber(String letters) {
        if (letters == null || letters.isEmpty()) {
            return 0;
        }
        int n = 0;
        for (int i = 0; i < letters.length(); i++) {
            char c = letters.charAt(i);
            if (c < 'A' || (c > 'Z' && c < 'a') || c > 'z') {
                return 0;
            }
            char upper = Character.toUpperCase(c);
            n = n * 26 + (upper - 'A' + 1);
        }
        return n;
    }
}
