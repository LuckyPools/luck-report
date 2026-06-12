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
package com.luck.report.web.domain.vo;

import com.luck.report.core.definition.CellStyle;
import com.luck.report.core.definition.Expand;

import java.io.Serializable;
import java.util.List;

/**
 * CellDefinition的VO类，用于前端展示
 * 排除所有 @JsonIgnore 标记的字段
 *
 * @author LuckyPools
 * @since 2026年
 */
public class CellDefinitionVo implements Serializable {
    private static final long serialVersionUID = 1L;

    private int rowNumber;
    private int columnNumber;
    private int rowSpan;
    private int colSpan;
    private String name;
    private Object value;
    private CellStyle cellStyle;
    private String linkUrl;
    private String linkTargetWindow;
    private List<LinkParameterVo> linkParameters;
    private boolean fillBlankRows;
    private int multiple;
    private Expand expand;
    private String leftParentCellName;
    private String topParentCellName;
    private List<ConditionPropertyItemVo> conditionPropertyItems;

    /**
     * 默认无参构造器
     */
    public CellDefinitionVo() {}

    public int getRowNumber() {
        return rowNumber;
    }

    public void setRowNumber(int rowNumber) {
        this.rowNumber = rowNumber;
    }

    public int getColumnNumber() {
        return columnNumber;
    }

    public void setColumnNumber(int columnNumber) {
        this.columnNumber = columnNumber;
    }

    public int getRowSpan() {
        return rowSpan;
    }

    public void setRowSpan(int rowSpan) {
        this.rowSpan = rowSpan;
    }

    public int getColSpan() {
        return colSpan;
    }

    public void setColSpan(int colSpan) {
        this.colSpan = colSpan;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Object getValue() {
        return value;
    }

    public void setValue(Object value) {
        this.value = value;
    }

    public CellStyle getCellStyle() {
        return cellStyle;
    }

    public void setCellStyle(CellStyle cellStyle) {
        this.cellStyle = cellStyle;
    }

    public String getLinkUrl() {
        return linkUrl;
    }

    public void setLinkUrl(String linkUrl) {
        this.linkUrl = linkUrl;
    }

    public String getLinkTargetWindow() {
        return linkTargetWindow;
    }

    public void setLinkTargetWindow(String linkTargetWindow) {
        this.linkTargetWindow = linkTargetWindow;
    }

    public List<LinkParameterVo> getLinkParameters() {
        return linkParameters;
    }

    public void setLinkParameters(List<LinkParameterVo> linkParameters) {
        this.linkParameters = linkParameters;
    }

    public boolean isFillBlankRows() {
        return fillBlankRows;
    }

    public void setFillBlankRows(boolean fillBlankRows) {
        this.fillBlankRows = fillBlankRows;
    }

    public int getMultiple() {
        return multiple;
    }

    public void setMultiple(int multiple) {
        this.multiple = multiple;
    }

    public Expand getExpand() {
        return expand;
    }

    public void setExpand(Expand expand) {
        this.expand = expand;
    }

    public String getLeftParentCellName() {
        return leftParentCellName;
    }

    public void setLeftParentCellName(String leftParentCellName) {
        this.leftParentCellName = leftParentCellName;
    }

    public String getTopParentCellName() {
        return topParentCellName;
    }

    public void setTopParentCellName(String topParentCellName) {
        this.topParentCellName = topParentCellName;
    }

    public List<ConditionPropertyItemVo> getConditionPropertyItems() {
        return conditionPropertyItems;
    }

    public void setConditionPropertyItems(List<ConditionPropertyItemVo> conditionPropertyItems) {
        this.conditionPropertyItems = conditionPropertyItems;
    }
}
