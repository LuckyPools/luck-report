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
package com.luck.report.web.controller.designer;

import com.luck.report.core.definition.*;
import com.luck.report.core.definition.datasource.DatasourceDefinition;
import com.luck.report.core.definition.searchform.SearchForm;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * @author Jacky.gao
 * @since 2017年1月29日
 */
public class ReportDefinitionWrapper {
    private final Paper paper;
    private final HeaderFooterDefinition header;
    private final HeaderFooterDefinition footer;
    private final List<RowDefinition> rows;
    private final List<ColumnDefinition> columns;
    private final List<DatasourceDefinition> datasources;
    private final Map<String, CellDefinition> cellsMap = new HashMap<String, CellDefinition>();
    private SearchForm searchForm;

    public ReportDefinitionWrapper(ReportDefinition report) {
        this.paper = report.getPaper();
        this.header = report.getHeader();
        this.footer = report.getFooter();
        this.searchForm = report.getSearchForm();
        this.rows = report.getRows();
        this.columns = report.getColumns();
        this.datasources = report.getDatasources();
        for (CellDefinition cell : report.getCells()) {
            cellsMap.put(cell.getRowNumber() + "," + cell.getColumnNumber(), cell);
        }
    }

    public List<ColumnDefinition> getColumns() {
        return columns;
    }

    public List<DatasourceDefinition> getDatasources() {
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

    public Map<String, CellDefinition> getCellsMap() {
        return cellsMap;
    }

    public List<RowDefinition> getRows() {
        return rows;
    }
}
