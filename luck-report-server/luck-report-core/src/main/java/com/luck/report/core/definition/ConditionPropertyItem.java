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

import com.luck.report.core.expression.ExpressionUtils;
import com.luck.report.core.expression.model.Condition;
import com.luck.report.core.expression.model.Expression;
import com.luck.report.core.expression.model.condition.BaseCondition;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.io.Serializable;
import java.util.List;

/**
 * @author Jacky.gao
 * @since 2017年4月10日
 */
public class ConditionPropertyItem implements Serializable {
    private static final long serialVersionUID = 1L;
    private String name;
    /**
     * 此属性给设计器使用，引擎不使用该属性
     */
    private List<Condition> conditions;

    private int rowHeight = -1;
    private int colWidth = -1;

    private String newValue;
    /**
     * 渲染标记：null=未配置(不覆盖)；true=渲染单元格内容(默认)；false=参与计算但不渲染内容
     */
    private Boolean renderFlag;
    private String linkUrl;
    private String linkTargetWindow;
    private List<LinkParameter> linkParameters;

    private ConditionCellStyle cellStyle;

    private ConditionPaging paging;

    private String expr;

    @JsonIgnore // 内部重构 conditions
    private Condition condition;

    @JsonIgnore // 内部重构 expr
    private Expression expression;

    /**
     * 默认无参构造器
     */
    public ConditionPropertyItem() {}

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Condition getCondition() {
        return condition;
    }

    public void setCondition(Condition condition) {
        this.condition = condition;
    }

    public List<Condition> getConditions() {
        return conditions;
    }

    /**
     * 设置条件列表，同时自动构建条件链表
     * @param conditions 条件列表
     */
    public void setConditions(List<Condition> conditions) {
        this.conditions = conditions;
        if (conditions != null && !conditions.isEmpty()) {
            BaseCondition topCondition = null;
            BaseCondition prevCondition = null;
            for (Condition cond : conditions) {
                if (!(cond instanceof BaseCondition)) {
                    continue;
                }
                BaseCondition baseCond = (BaseCondition) cond;
                if (topCondition == null) {
                    topCondition = baseCond;
                    prevCondition = baseCond;
                } else {
                    prevCondition.setNextCondition(baseCond);
                    prevCondition = baseCond;
                }
            }
            this.condition = topCondition;
        }
    }

    public String getNewValue() {
        return newValue;
    }

    public void setNewValue(String newValue) {
        this.newValue = newValue;
    }

    public Boolean getRenderFlag() {
        return renderFlag;
    }

    public void setRenderFlag(Boolean renderFlag) {
        this.renderFlag = renderFlag;
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

    public List<LinkParameter> getLinkParameters() {
        return linkParameters;
    }

    public void setLinkParameters(List<LinkParameter> linkParameters) {
        this.linkParameters = linkParameters;
    }

    public ConditionCellStyle getCellStyle() {
        return cellStyle;
    }

    public void setCellStyle(ConditionCellStyle cellStyle) {
        this.cellStyle = cellStyle;
    }

    public Expression getExpression() {
        return expression;
    }

    public void setExpression(Expression expression) {
        this.expression = expression;
    }

    public String getExpr() {
        return expr;
    }

    /**
     * 设置表达式字符串，同时自动解析为Expression对象
     * @param expr 表达式字符串
     */
    public void setExpr(String expr) {
        this.expr = expr;
        if (expr != null && !expr.isEmpty()) {
            this.expression = ExpressionUtils.parseExpression(expr);
        }
    }

    public int getRowHeight() {
        return rowHeight;
    }

    public void setRowHeight(int rowHeight) {
        this.rowHeight = rowHeight;
    }

    public int getColWidth() {
        return colWidth;
    }

    public void setColWidth(int colWidth) {
        this.colWidth = colWidth;
    }

    public ConditionPaging getPaging() {
        return paging;
    }

    public void setPaging(ConditionPaging paging) {
        this.paging = paging;
    }
}
