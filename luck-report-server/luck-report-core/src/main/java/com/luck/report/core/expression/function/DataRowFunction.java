
package com.luck.report.core.expression.function;

import com.luck.report.core.build.Context;
import com.luck.report.core.expression.model.data.ExpressionData;
import com.luck.report.core.model.Cell;
import com.luck.report.core.model.Row;
import org.apache.commons.lang3.StringUtils;

import java.util.List;

/**
 * 数据行号计算函数
 * <p>
 * 用于在报表模板中动态计算数据行的序号。
 * 自动计算从左侧父单元格到当前行的有效数据行序号。
 * </p>
 * <p>
 * 算法说明：
 * <ul>
 *   <li>通过左侧父单元格确定数据区域的起始行</li>
 *   <li>当前行号 - 起始行号 + 1 = 数据行序号</li>
 * </ul>
 * </p>
 *
 * @author LuckyPools
 * @date 2026-05-27
 */
public class DataRowFunction implements Function {

    /**
     * 执行数据行号计算
     *
     * @param dataList    表达式参数列表（本函数不使用参数）
     * @param context     报表构建上下文，用于获取行列信息
     * @param currentCell 当前单元格，用于获取行、父单元格等信息
     * @return 计算后的行号（从1开始），如果无法计算则返回null
     */
    @Override
    public Object execute(List<ExpressionData<?>> dataList, Context context, Cell currentCell) {
        Row currentRow = currentCell.getRow();
        if (currentRow == null) {
            return null;
        }

        return calculateDataRowNumber(currentCell, currentRow);
    }

    /**
     * 计算数据行序号
     * <p>
     * 核心算法：当前行号 - 起始行号 + 1
     * </p>
     *
     * @param currentCell 当前单元格
     * @param currentRow  当前行
     * @return 数据行序号（从1开始）
     */
    private Integer calculateDataRowNumber(Cell currentCell, Row currentRow) {
        Cell leftParentCell = currentCell.getLeftParentCell();
        if (leftParentCell == null) {
            return 1;
        }

        int currentRowNumber = currentRow.getRowNumber();
        int startRowNumber = extractStartRowNumber(leftParentCell);

        if (startRowNumber >= currentRowNumber) {
            return 1;
        }

        return currentRowNumber - startRowNumber + 1;
    }

    /**
     * 从左侧父单元格名称中提取起始行号
     *
     * @param leftParentCell 左侧父单元格
     * @return 起始行号，如果无法提取则返回1
     */
    private int extractStartRowNumber(Cell leftParentCell) {
        String cellName = leftParentCell.getName();
        if (StringUtils.isBlank(cellName)) {
            return 1;
        }

        String numberPart = cellName.replaceAll("[a-zA-Z]", "");
        if (StringUtils.isBlank(numberPart)) {
            return 1;
        }

        try {
            return Integer.parseInt(numberPart);
        } catch (NumberFormatException e) {
            return 1;
        }
    }

    /**
     * 获取函数名称
     *
     * @return 函数名称 "dataRow"
     */
    @Override
    public String name() {
        return "dataRow";
    }
}
