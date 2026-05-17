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

import com.luck.report.core.build.Context;
import com.luck.report.core.build.paging.HeaderFooter;
import com.luck.report.core.expression.ExpressionUtils;
import com.luck.report.core.expression.model.Expression;
import com.luck.report.core.expression.model.data.ExpressionData;
import com.luck.report.core.expression.model.data.ObjectExpressionData;
import com.luck.report.core.expression.model.data.ObjectListExpressionData;
import com.fasterxml.jackson.annotation.JsonIgnore;
import org.apache.commons.lang3.StringUtils;

import java.io.Serializable;
import java.util.List;

/**
 * @author Jacky.gao
 * @since 2017年1月16日
 */
public class HeaderFooterDefinition implements Serializable {
    private static final long serialVersionUID = 1L;
    private String left;
    private String center;
    private String right;
    private String fontFamily = "宋体";
    private int fontSize = 10;
    private String forecolor = "0,0,0";
    private boolean bold;
    private boolean italic;
    private boolean underline;
    private int height = 30;
    private int margin = 30;
    @JsonIgnore // 内部重构 left
    private Expression leftExpression;
    @JsonIgnore // 内部重构 center
    private Expression centerExpression;
    @JsonIgnore // 内部重构 right
    private Expression rightExpression;

    /**
     * 默认无参构造器
     */
    public HeaderFooterDefinition() {}

    public HeaderFooter buildHeaderFooter(int pageIndex, Context context) {
        HeaderFooter hf = new HeaderFooter();
        hf.setBold(bold);
        hf.setFontFamily(fontFamily);
        hf.setFontSize(fontSize);
        hf.setForecolor(forecolor);
        hf.setHeight(height);
        hf.setItalic(italic);
        hf.setUnderline(underline);
        hf.setMargin(margin);
        context.setPageIndex(pageIndex);
        if (leftExpression != null) {
            Object obj = buildExpression(context, leftExpression);
            if (obj != null) {
                hf.setLeft(obj.toString());
            }
        }
        if (centerExpression != null) {
            Object obj = buildExpression(context, centerExpression);
            if (obj != null) {
                hf.setCenter(obj.toString());
            }
        }
        if (rightExpression != null) {
            Object obj = buildExpression(context, rightExpression);
            if (obj != null) {
                hf.setRight(obj.toString());
            }
        }
        return hf;
    }

    private Object buildExpression(Context context, Expression expr) {
        ExpressionData<?> data = expr.execute(context.getRootCell(), context.getRootCell(), context);
        Object obj = null;
        if (data instanceof ObjectExpressionData) {
            obj = ((ObjectExpressionData) data).getData();
        } else if (data instanceof ObjectListExpressionData) {
            ObjectListExpressionData listData = (ObjectListExpressionData) data;
            if (listData != null) {
                List<?> list = listData.getData();
                if (list != null && list.size() > 0) {
                    obj = "";
                    for (Object o : list) {
                        if (o == null) {
                            continue;
                        }
                        if (!obj.equals("")) {
                            obj += ",";
                        }
                        obj += o.toString();
                    }
                }
            }
        }
        return obj;
    }
    public String getLeft() {
        return left;
    }

    /**
     * 设置左侧内容，同时自动解析表达式
     * @param left 左侧内容字符串
     */
    public void setLeft(String left) {
        this.left = left;
        if (StringUtils.isNotBlank(left)) {
            this.leftExpression = ExpressionUtils.parseExpression(left);
        }
    }

    public String getCenter() {
        return center;
    }

    /**
     * 设置中间内容，同时自动解析表达式
     * @param center 中间内容字符串
     */
    public void setCenter(String center) {
        this.center = center;
        if (StringUtils.isNotBlank(center)) {
            this.centerExpression = ExpressionUtils.parseExpression(center);
        }
    }

    public String getRight() {
        return right;
    }

    /**
     * 设置右侧内容，同时自动解析表达式
     * @param right 右侧内容字符串
     */
    public void setRight(String right) {
        this.right = right;
        if (StringUtils.isNotBlank(right)) {
            this.rightExpression = ExpressionUtils.parseExpression(right);
        }
    }
    public String getFontFamily() {
        return fontFamily;
    }
    public void setFontFamily(String fontFamily) {
        this.fontFamily = fontFamily;
    }
    public int getFontSize() {
        return fontSize;
    }
    public void setFontSize(int fontSize) {
        this.fontSize = fontSize;
    }
    public String getForecolor() {
        return forecolor;
    }
    public void setForecolor(String forecolor) {
        this.forecolor = forecolor;
    }
    public boolean isBold() {
        return bold;
    }
    public void setBold(boolean bold) {
        this.bold = bold;
    }
    public boolean isItalic() {
        return italic;
    }
    public void setItalic(boolean italic) {
        this.italic = italic;
    }
    public boolean isUnderline() {
        return underline;
    }
    public void setUnderline(boolean underline) {
        this.underline = underline;
    }
    public int getHeight() {
        return height;
    }
    public void setHeight(int height) {
        this.height = height;
    }
    public int getMargin() {
        return margin;
    }
    public void setMargin(int margin) {
        this.margin = margin;
    }
    public Expression getLeftExpression() {
        return leftExpression;
    }
    public void setLeftExpression(Expression leftExpression) {
        this.leftExpression = leftExpression;
    }
    public Expression getCenterExpression() {
        return centerExpression;
    }
    public void setCenterExpression(Expression centerExpression) {
        this.centerExpression = centerExpression;
    }
    public Expression getRightExpression() {
        return rightExpression;
    }
    public void setRightExpression(Expression rightExpression) {
        this.rightExpression = rightExpression;
    }
}
