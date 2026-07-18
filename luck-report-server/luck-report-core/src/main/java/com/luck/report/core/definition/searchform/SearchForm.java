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
package com.luck.report.core.definition.searchform;

import com.luck.report.core.definition.searchform.component.Component;

import java.io.Serializable;
import java.util.List;

public class SearchForm implements Serializable {
    private static final long serialVersionUID = 1L;
    private String formRef;
    private String tag;
    private String formModel;
    private String size;
    private String labelPosition;
    private Integer labelWidth;
    private String formRules;
    private Integer gutter;
    private boolean disabled;
    private Integer span;
    private boolean formBtns;
    private List<Component> fields;

    /**
     * 默认无参构造器
     */
    public SearchForm() {}

    public String getFormRef() {
        return formRef;
    }

    public void setFormRef(String formRef) {
        this.formRef = formRef;
    }

    public String getTag() {
        return tag;
    }

    public void setTag(String tag) {
        this.tag = tag;
    }

    public String getFormModel() {
        return formModel;
    }

    public void setFormModel(String formModel) {
        this.formModel = formModel;
    }

    public String getSize() {
        return size;
    }

    public void setSize(String size) {
        this.size = size;
    }

    public String getLabelPosition() {
        return labelPosition;
    }

    public void setLabelPosition(String labelPosition) {
        this.labelPosition = labelPosition;
    }

    public Integer getLabelWidth() {
        return labelWidth;
    }

    public void setLabelWidth(Integer labelWidth) {
        this.labelWidth = labelWidth;
    }

    public String getFormRules() {
        return formRules;
    }

    public void setFormRules(String formRules) {
        this.formRules = formRules;
    }

    public Integer getGutter() {
        return gutter;
    }

    public void setGutter(Integer gutter) {
        this.gutter = gutter;
    }

    public boolean isDisabled() {
        return disabled;
    }

    public void setDisabled(boolean disabled) {
        this.disabled = disabled;
    }

    public Integer getSpan() {
        return span;
    }

    public void setSpan(Integer span) {
        this.span = span;
    }

    public boolean isFormBtns() {
        return formBtns;
    }

    public void setFormBtns(boolean formBtns) {
        this.formBtns = formBtns;
    }

    public List<Component> getFields() {
        return fields;
    }

    public void setFields(List<Component> components) {
        this.fields = components;
    }
}
