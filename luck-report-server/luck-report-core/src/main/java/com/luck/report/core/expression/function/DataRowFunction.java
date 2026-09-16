
package com.luck.report.core.expression.function;

import com.luck.report.core.build.Context;
import com.luck.report.core.expression.model.data.ExpressionData;
import com.luck.report.core.model.Cell;
import org.apache.commons.lang3.StringUtils;

import java.util.IdentityHashMap;
import java.util.List;
import java.util.Map;

/**
 * dataRow：左父格在同一上层父格分组内的展开序号（从 1 开始）。
 *
 * @author LuckyPools
 * @date 2026-05-27
 */
public class DataRowFunction implements Function {

    @Override
    public Object execute(List<ExpressionData<?>> dataList, Context context, Cell currentCell) {
        if (currentCell == null || currentCell.getRow() == null) {
            return null;
        }
        return calculateParentExpandIndex(context, currentCell);
    }

    private Integer calculateParentExpandIndex(Context context, Cell currentCell) {
        Cell leftParentCell = currentCell.getLeftParentCell();
        if (leftParentCell == null) {
            return 1;
        }

        String parentName = leftParentCell.getName();
        if (StringUtils.isBlank(parentName) || context == null || context.getReport() == null) {
            return 1;
        }

        Map<String, List<Cell>> cellsMap = context.getReport().getCellsMap();
        if (cellsMap == null) {
            return 1;
        }

        List<Cell> siblings = cellsMap.get(parentName);
        if (siblings == null || siblings.isEmpty()) {
            return 1;
        }

        Map<Cell, Integer> indexMap = context.getDataRowIndexCache(parentName, siblings.size());
        if (indexMap == null) {
            indexMap = buildIndexMap(siblings);
            context.putDataRowIndexCache(parentName, siblings.size(), indexMap);
        }

        Integer seq = indexMap.get(leftParentCell);
        return seq != null ? seq : 1;
    }

    /**
     * 按 cellsMap 顺序，在同一上层左父格内从 1 编号；整次构建每个名字只建一次。
     */
    private Map<Cell, Integer> buildIndexMap(List<Cell> siblings) {
        Map<Cell, Integer> indexMap = new IdentityHashMap<Cell, Integer>();
        Map<Cell, Integer> groupCounter = new IdentityHashMap<Cell, Integer>();
        int nullGroupIndex = 0;

        for (Cell sibling : siblings) {
            Cell groupParent = sibling.getLeftParentCell();
            int seq;
            if (groupParent == null) {
                nullGroupIndex++;
                seq = nullGroupIndex;
            } else {
                Integer current = groupCounter.get(groupParent);
                seq = (current == null ? 0 : current.intValue()) + 1;
                groupCounter.put(groupParent, Integer.valueOf(seq));
            }
            indexMap.put(sibling, Integer.valueOf(seq));
        }
        return indexMap;
    }

    @Override
    public String name() {
        return "dataRow";
    }
}
