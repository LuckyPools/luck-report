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
package com.luck.report.core.chart.option.impl;

import java.io.Serializable;

import com.luck.report.core.chart.FontStyle;
import com.luck.report.core.chart.option.Option;
import com.luck.report.core.chart.option.Position;

/**
 * @author Jacky.gao
 * @since 2017年6月8日
 */
public class TitleOption implements Option, Serializable {
    private static final long serialVersionUID = 1L;
    private boolean display;
    private Position position = Position.top;
    private int fontSize = 14;
    private String fontColor = "#666";
    private FontStyle fontStyle = FontStyle.bold;
    private int padding = 10;
    private String text;

    public TitleOption() {}

    @Override
    public String buildOptionJson() {
        StringBuilder sb = new StringBuilder();
        sb.append("\"title\":{");
        sb.append("\"display\":" + display + ",");
        sb.append("\"text\":\"" + text + "\",");
        sb.append("\"position\":\"" + position + "\",");
        sb.append("\"fontSize\":" + fontSize + ",");
        sb.append("\"fontColor\":\"" + fontColor + "\",");
        sb.append("\"fontStyle\":\"" + fontStyle + "\",");
        sb.append("\"padding\":\"" + padding + "\"");
        sb.append("}");
        return sb.toString();
    }

    @Override
    public String getType() {
        return "title";
    }

    /**
     * 空实现，用于兼容JSON反序列化时可能存在的type字段
     * @param type 类型（忽略）
     */
    public void setType(String type) {
        // 空实现，忽略type字段
    }

    public boolean isDisplay() {
        return display;
    }

    public void setDisplay(boolean display) {
        this.display = display;
    }

    public Position getPosition() {
        return position;
    }

    public void setPosition(Position position) {
        this.position = position;
    }

    public int getFontSize() {
        return fontSize;
    }

    public void setFontSize(int fontSize) {
        this.fontSize = fontSize;
    }

    public String getFontColor() {
        return fontColor;
    }

    public void setFontColor(String fontColor) {
        this.fontColor = fontColor;
    }

    public FontStyle getFontStyle() {
        return fontStyle;
    }

    public void setFontStyle(FontStyle fontStyle) {
        this.fontStyle = fontStyle;
    }

    public int getPadding() {
        return padding;
    }

    public void setPadding(int padding) {
        this.padding = padding;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }
}
