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
package com.luck.report.core.definition;

import com.luck.report.core.definition.datasource.DatasourceDefinition;
import com.luck.report.core.definition.searchform.SearchForm;
import com.luck.report.core.expression.ExpressionUtils;
import com.luck.report.core.model.Cell;
import com.luck.report.core.model.Column;
import com.luck.report.core.model.Report;
import com.luck.report.core.model.Row;
import org.apache.commons.lang.StringUtils;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.io.Serializable;
import java.util.*;

/**
 * @author Jacky.gao
 * @since 2016年11月1日
 */
public class ReportDefinition implements Serializable {
	private static final long serialVersionUID = 1L;
	private String reportFullName;
	private Paper paper;
	private CellDefinition rootCell;
	private HeaderFooterDefinition header;
	private HeaderFooterDefinition footer;
	private SearchForm searchForm;
	private List<CellDefinition> cells;
	private List<RowDefinition> rows;
	private List<ColumnDefinition> columns;
	private List<DatasourceDefinition> datasources;
	@JsonIgnore // 内部重构
	private String style;

	/**
	 * 默认无参构造器
	 */
	public ReportDefinition() {
	}

	public Report newReport() {
		Report report = new Report();
		report.setReportFullName(reportFullName);
		report.setPaper(paper);
		report.setHeader(header);
		report.setFooter(footer);
		List<Row> reportRows = new ArrayList<Row>();
		List<Column> reportColumns = new ArrayList<Column>();
		report.setRows(reportRows);
		report.setColumns(reportColumns);
		Map<Integer, Row> rowMap = new HashMap<Integer, Row>();
		int headerRowsHeight = 0, footerRowsHeight = 0, titleRowsHeight = 0, summaryRowsHeight = 0;
		for (RowDefinition rowDef : rows) {
			Row newRow = rowDef.newRow(reportRows);
			report.insertRow(newRow, rowDef.getRowNumber());
			rowMap.put(rowDef.getRowNumber(), newRow);
			Band band = rowDef.getBand();
			if (band != null) {
				if (band.equals(Band.headerrepeat)) {
					report.getHeaderRepeatRows().add(newRow);
					headerRowsHeight += newRow.getRealHeight();
				} else if (band.equals(Band.footerrepeat)) {
					report.getFooterRepeatRows().add(newRow);
					footerRowsHeight += newRow.getRealHeight();
				} else if (band.equals(Band.title)) {
					report.getTitleRows().add(newRow);
					titleRowsHeight += newRow.getRealHeight();
				} else if (band.equals(Band.summary)) {
					report.getSummaryRows().add(newRow);
					summaryRowsHeight += newRow.getRealHeight();
				}
			}
		}
		report.setRepeatHeaderRowHeight(headerRowsHeight);
		report.setRepeatFooterRowHeight(footerRowsHeight);
		report.setTitleRowsHeight(titleRowsHeight);
		report.setSummaryRowsHeight(summaryRowsHeight);
		Map<Integer, Column> columnMap = new HashMap<Integer, Column>();
		for (ColumnDefinition columnDef : columns) {
			Column newColumn = columnDef.newColumn(reportColumns);
			report.insertColumn(newColumn, columnDef.getColumnNumber());
			columnMap.put(columnDef.getColumnNumber(), newColumn);
		}
		Map<CellDefinition, Cell> cellMap = new HashMap<CellDefinition, Cell>();
		for (CellDefinition cellDef : cells) {
			Cell cell = cellDef.newCell();
			cellMap.put(cellDef, cell);
			Row targetRow = rowMap.get(cellDef.getRowNumber());
			cell.setRow(targetRow);
			targetRow.getCells().add(cell);
			Column targetColumn = columnMap.get(cellDef.getColumnNumber());
			cell.setColumn(targetColumn);
			targetColumn.getCells().add(cell);

			if (cellDef.getLeftParentCell() == null && cellDef.getTopParentCell() == null) {
				report.setRootCell(cell);
			}
			report.addCell(cell);
		}
		Map<String, CellDefinition> cellDefinitionMap = new HashMap<>();
		for (CellDefinition cellDef : cells) {
			cellDefinitionMap.put(cellDef.getName(), cellDef);
			Cell targetCell = cellMap.get(cellDef);
			CellDefinition leftParentCellDef = cellDef.getLeftParentCell();
			if (leftParentCellDef != null) {
				targetCell.setLeftParentCell(cellMap.get(leftParentCellDef));
			} else {
				targetCell.setLeftParentCell(null);
			}
			CellDefinition topParentCellDef = cellDef.getTopParentCell();
			if (topParentCellDef != null) {
				targetCell.setTopParentCell(cellMap.get(topParentCellDef));
			} else {
				targetCell.setTopParentCell(null);
			}
		}
		// 预计算每个 Cell 的 行列子单元格
		for (CellDefinition cellDef : cells) {
			Set<String> dependencyCellNames = ExpressionUtils.getDependencyCellNames(cellDef, cellDefinitionMap);
			if (!dependencyCellNames.isEmpty()) {
				for (String cellName : dependencyCellNames) {
					// 处理冒号分隔的多级依赖单元格坐标 [A1:B1:C1]
					if (cellName.contains(":")) {
						setChildCellNames(cellName.split(":"), cellDefinitionMap, cellMap);
						continue;
					}
					CellDefinition leftParent = fetchLeftParent(cellDef, cellName);
					if (leftParent != null) {
						Cell targetCell = null;
						if (leftParent.getName().equals(cellName)) {
							CellDefinition parent = leftParent.getLeftParentCell();
							if (parent != null) {
								targetCell = cellMap.get(parent);
							}
						} else {
							targetCell = cellMap.get(leftParent);
						}
						if (targetCell != null) {
							Set<String> rowChildNames = targetCell.getRowChildCellNames();
							if (rowChildNames == null) {
								rowChildNames = new HashSet<String>();
								targetCell.setRowChildCellNames(rowChildNames);
							}
							rowChildNames.add(cellName);
						}
					}
					CellDefinition topParent = fetchTopParent(cellDef, cellName);
					if (topParent != null) {
						Cell targetCell = null;
						if (topParent.getName().equals(cellName)) {
							CellDefinition parent = topParent.getTopParentCell();
							if (parent != null) {
								targetCell = cellMap.get(parent);
							}
						} else {
							targetCell = cellMap.get(topParent);
						}
						if (targetCell != null) {
							Set<String> columnChildNames = targetCell.getColumnChildCellNames();
							if (columnChildNames == null) {
								columnChildNames = new HashSet<String>();
								targetCell.setColumnChildCellNames(columnChildNames);
							}
							columnChildNames.add(cellName);
						}
					}
				}
			}
		}
		for (CellDefinition cellDef : cells) {
			Cell targetCell = cellMap.get(cellDef);
			Cell leftParentCell = targetCell.getLeftParentCell();
			if (leftParentCell != null) {
				leftParentCell.addRowChild(targetCell);
			}
			Cell topParentCell = targetCell.getTopParentCell();
			if (topParentCell != null) {
				topParentCell.addColumnChild(targetCell);
			}
		}
		return report;
	}

	/**
	 * 处理冒号分隔的多级依赖单元格坐标绑定
	 */
	private void setChildCellNames(String[] cellNames, Map<String, CellDefinition> cellDefinitionMap, Map<CellDefinition, Cell> cellMap) {
		for (int i = cellNames.length - 1; i > 0; i--) {
			String name = cellNames[i];
			String preName = cellNames[i - 1];
			CellDefinition cur = cellDefinitionMap.get(name);
			if (cur == null) {
				continue;
			}
			CellDefinition leftParent = fetchLeftParent(cur, preName);
			if (leftParent != null && leftParent.getName().equals(preName)) {
				Cell targetCell = cellMap.get(leftParent);
				Set<String> rowChildNames = targetCell.getRowChildCellNames();
				if (rowChildNames == null) {
					rowChildNames = new HashSet<String>();
					targetCell.setRowChildCellNames(rowChildNames);
				}
				rowChildNames.add(name);
			}
			CellDefinition topParent = fetchTopParent(cur, preName);
			if (topParent != null && topParent.getName().equals(preName)) {
				Cell targetCell = cellMap.get(topParent);
				Set<String> columnChildNames = targetCell.getColumnChildCellNames();
				if (columnChildNames == null) {
					columnChildNames = new HashSet<String>();
					targetCell.setColumnChildCellNames(columnChildNames);
				}
				columnChildNames.add(name);
			}
		}
	}

	/**
	 * 沿左父格链向上查找匹配指定名称的 CellDefinition
	 */
	private CellDefinition fetchLeftParent(CellDefinition cellDef, String cellName) {
		CellDefinition leftParentCell = cellDef.getLeftParentCell();
		if (leftParentCell == null) {
			return null;
		}
		if (leftParentCell.getName().equals(cellName)) {
			return leftParentCell;
		}
		Set<String> newCellNames = leftParentCell.getNewCellNames();
		if (newCellNames != null && newCellNames.contains(cellName)) {
			return leftParentCell;
		}
		return fetchLeftParent(leftParentCell, cellName);
	}

	/**
	 * 沿上父格链向上查找匹配指定名称的 CellDefinition
	 */
	private CellDefinition fetchTopParent(CellDefinition cellDef, String cellName) {
		CellDefinition topParentCell = cellDef.getTopParentCell();
		if (topParentCell == null) {
			return null;
		}
		if (topParentCell.getName().equals(cellName)) {
			return topParentCell;
		}
		Set<String> newCellNames = topParentCell.getNewCellNames();
		if (newCellNames != null && newCellNames.contains(cellName)) {
			return topParentCell;
		}
		return fetchTopParent(topParentCell, cellName);
	}

	public String getStyle() {
		if (style == null) {
			style = buildStyle();
		}
		return style;
	}

	private String buildStyle() {
		StringBuffer sb = new StringBuffer();
		for (CellDefinition cell : cells) {
			CellStyle cellStyle = cell.getCellStyle();
			sb.append("._").append(cell.getName()).append("{");
			int colWidth = getColumnWidth(cell.getColumnNumber(), cell.getColSpan());
			sb.append("width:").append(colWidth).append("pt;");
			Alignment align = cellStyle.getAlign();
			if (align != null) {
				sb.append("text-align:").append(align.name()).append(";");
			}
			Alignment valign = cellStyle.getValign();
			if (valign != null) {
				sb.append("vertical-align:").append(valign.name()).append(";");
			}
			float lineHeight = cellStyle.getLineHeight();
			if (lineHeight > 0) {
				sb.append("line-height:").append(lineHeight).append(";");
			}
			String bgcolor = cellStyle.getBgcolor();
			if (StringUtils.isNotBlank(bgcolor)) {
				sb.append("background-color:rgb(").append(bgcolor).append(");");
			}
			String fontFamilty = cellStyle.getFontFamily();
			if (StringUtils.isNotBlank(fontFamilty)) {
				sb.append("font-family:").append(fontFamilty).append(";");
			}
			int fontSize = cellStyle.getFontSize();
			sb.append("font-size:").append(fontSize).append("pt;");
			String foreColor = cellStyle.getForecolor();
			if (StringUtils.isNotBlank(foreColor)) {
				sb.append("color:rgb(").append(foreColor).append(");");
			}
			Boolean bold = cellStyle.getBold(), italic = cellStyle.getItalic(), underline = cellStyle.getUnderline();
			if (bold != null && bold) {
				sb.append("font-weight:bold;");
			}
			if (italic != null && italic) {
				sb.append("font-style:italic;");
			}
			if (underline != null && underline) {
				sb.append("text-decoration:underline;");
			}
			Border border = cellStyle.getLeftBorder();
			if (border != null) {
				sb.append("border-left:").append(border.getStyle().name()).append(" ").append(border.getWidth()).append("px rgb(").append(border.getColor()).append(");");
			}
			border = cellStyle.getRightBorder();
			if (border != null) {
				sb.append("border-right:").append(border.getStyle().name()).append(" ").append(border.getWidth()).append("px rgb(").append(border.getColor()).append(");");
			}
			border = cellStyle.getTopBorder();
			if (border != null) {
				sb.append("border-top:").append(border.getStyle().name()).append(" ").append(border.getWidth()).append("px rgb(").append(border.getColor()).append(");");
			}
			border = cellStyle.getBottomBorder();
			if (border != null) {
				sb.append("border-bottom:").append(border.getStyle().name()).append(" ").append(border.getWidth()).append("px rgb(").append(border.getColor()).append(");");
			}
			sb.append("}");
		}
		return sb.toString();
	}

	public SearchForm buildSearchForm() {
		// todo 查询页转化
		return searchForm;
	}

	private int getColumnWidth(int columnNumber, int colSpan) {
		int width = 0;
		if (colSpan > 0) {
			colSpan--;
		}
		int end = columnNumber + colSpan;
		for (int i = columnNumber; i <= end; i++) {
			for (ColumnDefinition col : columns) {
				if (col.getColumnNumber() == i) {
					width += col.getWidth();
				}
			}
		}
		return width;
	}

	public String getReportFullName() {
		return reportFullName;
	}

	public void setReportFullName(String reportFullName) {
		this.reportFullName = reportFullName;
	}

	public Paper getPaper() {
		return paper;
	}

	public void setPaper(Paper paper) {
		this.paper = paper;
	}

	public CellDefinition getRootCell() {
		return rootCell;
	}

	public void setRootCell(CellDefinition rootCell) {
		this.rootCell = rootCell;
	}

	public HeaderFooterDefinition getHeader() {
		return header;
	}

	public void setHeader(HeaderFooterDefinition header) {
		this.header = header;
	}

	public HeaderFooterDefinition getFooter() {
		return footer;
	}

	public void setFooter(HeaderFooterDefinition footer) {
		this.footer = footer;
	}

	public SearchForm getSearchForm() {
		return searchForm;
	}

	public void setSearchForm(SearchForm searchForm) {
		this.searchForm = searchForm;
	}

	public List<RowDefinition> getRows() {
		return rows;
	}

	public void setRows(List<RowDefinition> rows) {
		this.rows = rows;
	}

	public List<ColumnDefinition> getColumns() {
		return columns;
	}

	public void setColumns(List<ColumnDefinition> columns) {
		this.columns = columns;
	}

	public List<CellDefinition> getCells() {
		return cells;
	}

	public void setCells(List<CellDefinition> cells) {
		this.cells = cells;
	}

	public List<DatasourceDefinition> getDatasources() {
		return datasources;
	}

	public void setDatasources(List<DatasourceDefinition> datasources) {
		this.datasources = datasources;
	}
}
