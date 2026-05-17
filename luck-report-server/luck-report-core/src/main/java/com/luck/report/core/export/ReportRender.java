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
package com.luck.report.core.export;

import com.luck.report.core.build.ReportBuilder;
import com.luck.report.core.cache.ReportDefinitionCache;
import com.luck.report.core.definition.CellDefinition;
import com.luck.report.core.definition.Expand;
import com.luck.report.core.definition.ReportDefinition;
import com.luck.report.core.exception.ReportException;
import com.luck.report.core.exception.ReportParseException;
import com.luck.report.core.export.builder.down.DownCellbuilder;
import com.luck.report.core.export.builder.right.RightCellbuilder;
import com.luck.report.core.model.Report;
import com.luck.report.core.parser.ReportParser;
import com.luck.report.core.provider.report.ReportProvider;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;

import java.io.IOException;
import java.io.InputStream;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * @author Jacky.gao
 * @since 2016年12月4日
 */
public class ReportRender implements ApplicationContextAware {
    private ReportParser reportParser;
    private ReportBuilder reportBuilder;
    private Collection<ReportProvider> reportProviders;
    private DownCellbuilder downCellParentbuilder = new DownCellbuilder();
    private RightCellbuilder rightCellParentbuilder = new RightCellbuilder();

    public Report render(String file, Map<String, Object> parameters) {
        ReportDefinition reportDefinition = getReportDefinition(file);
        return reportBuilder.buildReport(reportDefinition, parameters);
    }

    public Report render(ReportDefinition reportDefinition, Map<String, Object> parameters) {
        return reportBuilder.buildReport(reportDefinition, parameters);
    }

    public ReportDefinition getReportDefinition(String file) {
        ReportDefinition reportDefinition = ReportDefinitionCache.getObject(file);
        if (reportDefinition == null) {
            reportDefinition = parseReport(file);
            ReportDefinitionCache.putObject(file, reportDefinition);
        }
        rebuildReportDefinition(reportDefinition);
        return reportDefinition;
    }

    public void rebuildReportDefinition(ReportDefinition reportDefinition) {
        List<CellDefinition> cells = reportDefinition.getCells();
        rebuildParentCell(cells);
        for (CellDefinition cell : cells) {
            addRowChildCell(cell, cell);
            addColumnChildCell(cell, cell);
        }
        for (CellDefinition cell : cells) {
            Expand expand = cell.getExpand();
            if (expand.equals(Expand.Down)) {
                downCellParentbuilder.buildParentCell(cell, cells);
            } else if (expand.equals(Expand.Right)) {
                rightCellParentbuilder.buildParentCell(cell, cells);
            }
        }
    }

    /**
     * 重建 CellDefinition 的 leftParentCell 和 topParentCell 引用，
     * 解决从缓存反序列化后 @JsonIgnore 字段丢失的问题。
     *
     * @param cells 所有单元格定义列表，不能为空
     */
    private void rebuildParentCell(List<CellDefinition> cells) {
        Map<String, CellDefinition> cellsMap = new HashMap<String, CellDefinition>();
        Map<String, CellDefinition> cellsRowColMap = new HashMap<String, CellDefinition>();
        for (CellDefinition cell : cells) {
            cellsMap.put(cell.getName(), cell);
            int rowNum = cell.getRowNumber(), colNum = cell.getColumnNumber(), rowSpan = cell.getRowSpan(), colSpan = cell.getColSpan();
            rowSpan = rowSpan > 0 ? rowSpan-- : 1;
            colSpan = colSpan > 0 ? colSpan-- : 1;
            int rowStart = rowNum, rowEnd = rowNum + rowSpan, colStart = colNum, colEnd = colNum + colSpan;
            for (int i = rowStart; i < rowEnd; i++) {
                cellsRowColMap.put(i + "," + colNum, cell);
            }
            for (int i = colStart; i < colEnd; i++) {
                cellsRowColMap.put(rowNum + "," + i, cell);
            }
        }
        for (CellDefinition cell : cells) {
            int rowNumber = cell.getRowNumber();
            int colNumber = cell.getColumnNumber();
            String leftParentCellName = cell.getLeftParentCellName();
            if (StringUtils.isNotBlank(leftParentCellName)) {
                if (!leftParentCellName.equals("root")) {
                    CellDefinition targetCell = cellsMap.get(leftParentCellName);
                    if (targetCell == null) {
                        throw new ReportException("Cell [" + cell.getName() + "] 's left parent cell [" + leftParentCellName + "] not exist.");
                    }
                    cell.setLeftParentCell(targetCell);
                }
            } else {
                if (colNumber > 1) {
                    CellDefinition targetCell = cellsRowColMap.get(rowNumber + "," + (colNumber - 1));
                    cell.setLeftParentCell(targetCell);
                }
            }
            String topParentCellName = cell.getTopParentCellName();
            if (StringUtils.isNotBlank(topParentCellName)) {
                if (!topParentCellName.equals("root")) {
                    CellDefinition targetCell = cellsMap.get(topParentCellName);
                    if (targetCell == null) {
                        throw new ReportException("Cell [" + cell.getName() + "] 's top parent cell [" + topParentCellName + "] not exist.");
                    }
                    cell.setTopParentCell(targetCell);
                }
            } else {
                if (rowNumber > 1) {
                    CellDefinition targetCell = cellsRowColMap.get((rowNumber - 1) + "," + colNumber);
                    cell.setTopParentCell(targetCell);
                }
            }
        }
    }

    public ReportDefinition parseReport(String file) {
        InputStream inputStream = null;
        try {
            inputStream = buildReportFile(file);
            return reportParser.parse(inputStream, file);
        } finally {
            try {
                if (inputStream != null) {
                    inputStream.close();
                }
            } catch (IOException e) {
                throw new ReportParseException(e);
            }
        }
    }

    private InputStream buildReportFile(String file) {
        InputStream inputStream = null;
        for (ReportProvider provider : reportProviders) {
            if (file.startsWith(provider.getPrefix())) {
                inputStream = provider.loadReport(file);
            }
        }
        if (inputStream == null) {
            throw new ReportException("Report [" + file + "] not support.");
        }
        return inputStream;
    }

    private void addRowChildCell(CellDefinition cell, CellDefinition childCell) {
        CellDefinition leftCell = cell.getLeftParentCell();
        if (leftCell == null) {
            return;
        }
        List<CellDefinition> childrenCells = leftCell.getRowChildrenCells();
        childrenCells.add(childCell);
        addRowChildCell(leftCell, childCell);
    }

    private void addColumnChildCell(CellDefinition cell, CellDefinition childCell) {
        CellDefinition topCell = cell.getTopParentCell();
        if (topCell == null) {
            return;
        }
        List<CellDefinition> childrenCells = topCell.getColumnChildrenCells();
        childrenCells.add(childCell);
        addColumnChildCell(topCell, childCell);
    }

    public void setReportParser(ReportParser reportParser) {
        this.reportParser = reportParser;
    }

    public void setReportBuilder(ReportBuilder reportBuilder) {
        this.reportBuilder = reportBuilder;
    }

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        reportProviders = applicationContext.getBeansOfType(ReportProvider.class).values();
    }
}
