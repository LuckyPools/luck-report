package com.luck.report.core.definition.searchform.component;

import com.luck.report.core.definition.searchform.RenderContext;

public class SwitchComponent extends BaseInputComponent {
    private static final long serialVersionUID = 1L;
    private String activeColor;
    private String inactiveColor;
    private boolean activeValue;
    private boolean inactiveValue;
    private String defaultValue;

    /**
     * 默认无参构造器
     */
    public SwitchComponent() {}

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

    public String getDefaultValue() {
        return defaultValue;
    }

    public void setDefaultValue(String defaultValue) {
        this.defaultValue = defaultValue;
    }
}
