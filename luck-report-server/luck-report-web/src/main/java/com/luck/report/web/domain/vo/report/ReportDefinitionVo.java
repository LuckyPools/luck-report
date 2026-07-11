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
package com.luck.report.web.domain.vo.report;

import com.luck.report.core.definition.*;
import com.luck.report.core.definition.searchform.SearchForm;
import com.luck.report.web.converter.DefinitionVoConverter;
import com.luck.report.web.domain.vo.cell.CellDefinitionVo;
import com.luck.report.web.domain.vo.datasource.DatasourceDefinitionVo;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 报表定义VO类，用于前端展示
 * 将 CellDefinition 转换为 CellDefinitionVo，过滤前端不需要的字段
 *
 * @author Jacky.gao
 * @since 2017年1月29日
 */
public class ReportDefinitionVo {
    private final Paper paper;
    private final HeaderFooterDefinition header;
    private final HeaderFooterDefinition footer;
    private final List<RowDefinition> rows;
    private final List<ColumnDefinition> columns;
    private final List<DatasourceDefinitionVo> datasources;
    private final Map<String, CellDefinitionVo> cellsMap = new HashMap<String, CellDefinitionVo>();
    private SearchForm searchForm;

    /**
     * 构造函数，将 ReportDefinition 转换为 ReportDefinitionVo
     * @param report 报表定义
     */
    public ReportDefinitionVo(ReportDefinition report) {
        this.paper = report.getPaper();
        this.header = report.getHeader();
        this.footer = report.getFooter();
        this.searchForm = report.getSearchForm();
        this.rows = report.getRows();
        this.columns = report.getColumns();
        // 通过 Converter 多态分发，过滤 sqlExpression 等后端专用字段
        this.datasources = DefinitionVoConverter.toDatasourceVoList(report.getDatasources());
        for (CellDefinition cell : report.getCells()) {
            CellDefinitionVo cellVo = DefinitionVoConverter.toVo(cell);
            cellsMap.put(cell.getRowNumber() + "," + cell.getColumnNumber(), cellVo);
        }
    }

    public List<ColumnDefinition> getColumns() {
        return columns;
    }

    public List<DatasourceDefinitionVo> getDatasources() {
        return datasources;
    }

    public HeaderFooterDefinition getFooter() {
        return footer;
    }

    public HeaderFooterDefinition getHeader() {
        return header;
    }

    public Paper getPaper() {
        return paper;
    }

    public SearchForm getSearchForm() {
        return searchForm;
    }

    public void setSearchForm(SearchForm searchForm) {
        this.searchForm = searchForm;
    }

    public Map<String, CellDefinitionVo> getCellsMap() {
        return cellsMap;
    }

    public List<RowDefinition> getRows() {
        return rows;
    }
}
