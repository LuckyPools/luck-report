package com.luck.report.core.definition.searchform.component;

import com.luck.report.core.definition.searchform.RenderContext;

public class InputNumberComponent extends BaseInputComponent {
    private static final long serialVersionUID = 1L;
    private boolean stepStrictly;
    private String controlsPosition;
    private String defaultValue;

    /**
     * 默认无参构造器
     */
    public InputNumberComponent() {}

    @Override
    public String initJs(RenderContext context) {
        return "";
    }

    public boolean getStepStrictly() {
        return stepStrictly;
    }

    public void setStepStrictly(Boolean stepStrictly) {
        this.stepStrictly = stepStrictly;
    }

    public String getControlsPosition() {
        return controlsPosition;
    }

    public void setControlsPosition(String controlsPosition) {
        this.controlsPosition = controlsPosition;
    }

    public String getDefaultValue() {
        return defaultValue;
    }

    public void setDefaultValue(String defaultValue) {
        this.defaultValue = defaultValue;
    }
}
