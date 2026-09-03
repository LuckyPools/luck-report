package com.luck.report.core.definition.searchform.component;

import com.luck.report.core.definition.searchform.RenderContext;

import java.io.Serializable;

public class DatePickerComponent extends BaseInputComponent {
    private static final long serialVersionUID = 1L;
    private String format;
    private String type;
    private String placeholder;
    private boolean clearable;
    private String valueFormat;
    private String defaultValue;

    /**
     * 默认无参构造器
     */
    public DatePickerComponent() {}

    @Override
    public String initJs(RenderContext context) {
        return "";
    }

    public String getFormat() {
        return format;
    }

    public void setFormat(String format) {
        this.format = format;
    }

    @Override
    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getPlaceholder() {
        return placeholder;
    }

    public void setPlaceholder(String placeholder) {
        this.placeholder = placeholder;
    }

    public boolean isClearable() {
        return clearable;
    }

    public void setClearable(boolean clearable) {
        this.clearable = clearable;
    }

    public String getValueFormat() {
        return valueFormat;
    }

    public void setValueFormat(String valueFormat) {
        this.valueFormat = valueFormat;
    }

    public String getDefaultValue() {
        return defaultValue;
    }

    public void setDefaultValue(String defaultValue) {
        this.defaultValue = defaultValue;
    }
}
