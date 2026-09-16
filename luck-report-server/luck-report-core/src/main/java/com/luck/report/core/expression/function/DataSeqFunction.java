
package com.luck.report.core.expression.function;

import com.luck.report.core.build.Context;
import com.luck.report.core.expression.model.data.ExpressionData;
import com.luck.report.core.model.Cell;
import com.luck.report.core.model.Row;
import org.apache.commons.lang3.StringUtils;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.IdentityHashMap;
import java.util.List;
import java.util.Map;

/**
 * dataSeq：左父格全部同名实例按版面行序的连续序号（从 1 开始）。
 *
 * @author LuckyPools
 * @date 2026-09-16
 */
public class DataSeqFunction implements Function {

    @Override
    public Object execute(List<ExpressionData<?>> dataList, Context context, Cell currentCell) {
        if (currentCell == null || currentCell.getRow() == null) {
            return null;
        }
        return calculateContinuousIndex(context, currentCell);
    }

    private Integer calculateContinuousIndex(Context context, Cell currentCell) {
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

        Map<Cell, Integer> indexMap = context.getDataSeqIndexCache(parentName, siblings.size());
        if (indexMap == null) {
            indexMap = buildIndexMap(context.getReport().getRows(), siblings);
            context.putDataSeqIndexCache(parentName, siblings.size(), indexMap);
        }

        Integer seq = indexMap.get(leftParentCell);
        return seq != null ? seq : 1;
    }

    /**
     * 按版面行序为同名实例建立序号表，整次报表构建中每个名字只建一次。
     */
    private Map<Cell, Integer> buildIndexMap(List<Row> rows, List<Cell> siblings) {
        final Map<Row, Integer> rowPos = new IdentityHashMap<Row, Integer>();
        if (rows != null) {
            for (int i = 0; i < rows.size(); i++) {
                rowPos.put(rows.get(i), Integer.valueOf(i));
            }
        }

        final Map<Cell, Integer> mapPos = new IdentityHashMap<Cell, Integer>();
        for (int i = 0; i < siblings.size(); i++) {
            mapPos.put(siblings.get(i), Integer.valueOf(i));
        }

        List<Cell> ordered = new ArrayList<Cell>(siblings);
        Collections.sort(ordered, (a, b) -> {
            int ra = rowIndex(rowPos, a);
            int rb = rowIndex(rowPos, b);
            if (ra != rb) {
                return Integer.compare(ra, rb);
            }
            return Integer.compare(mapPos.get(a).intValue(), mapPos.get(b).intValue());
        });

        Map<Cell, Integer> indexMap = new IdentityHashMap<Cell, Integer>();
        for (int i = 0; i < ordered.size(); i++) {
            indexMap.put(ordered.get(i), Integer.valueOf(i + 1));
        }
        return indexMap;
    }

    private int rowIndex(Map<Row, Integer> rowPos, Cell cell) {
        if (cell == null || cell.getRow() == null) {
            return Integer.MAX_VALUE;
        }
        Integer idx = rowPos.get(cell.getRow());
        return idx == null ? Integer.MAX_VALUE : idx.intValue();
    }

    @Override
    public String name() {
        return "dataSeq";
    }
}
