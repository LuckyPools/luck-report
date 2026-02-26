package com.luck.report.core.definition.searchform.component;

import com.luck.report.core.definition.searchform.RenderContext;

public class SwitchComponent extends BaseInputComponent {
    private String activeColor;
    private String inactiveColor;
    private boolean disabled;
    private boolean activeValue;
    private boolean inactiveValue;
    private Object defaultValue;

    @Override
    public String initJs(RenderContext context) {
        return "";
    }

    public String getActiveColor() {
        return activeColor;
    }

    public void setActiveColor(String activeColor) {
        this.activeColor = activeColor;
    }

    public String getInactiveColor() {
        return inactiveColor;
    }

    public void setInactiveColor(String inactiveColor) {
        this.inactiveColor = inactiveColor;
    }

    public boolean isDisabled() {
        return disabled;
    }

    public void setDisabled(boolean disabled) {
        this.disabled = disabled;
    }

    public boolean isActiveValue() {
        return activeValue;
    }

    public void setActiveValue(boolean activeValue) {
        this.activeValue = activeValue;
    }

    public boolean isInactiveValue() {
        return inactiveValue;
    }

    public void setInactiveValue(boolean inactiveValue) {
        this.inactiveValue = inactiveValue;
    }

    public Object getDefaultValue() {
        return defaultValue;
    }

    public void setDefaultValue(Object defaultValue) {
        this.defaultValue = defaultValue;
    }
}
