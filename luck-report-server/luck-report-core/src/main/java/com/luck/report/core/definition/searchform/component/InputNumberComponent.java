package com.luck.report.core.definition.searchform.component;

import com.luck.report.core.definition.searchform.RenderContext;

public class InputNumberComponent extends BaseInputComponent {
    private boolean stepStrictly;
    private String controlsPosition;
    private boolean disabled;
    private String defaultValue;

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

    public boolean getDisabled() {
        return disabled;
    }

    public void setDisabled(Boolean disabled) {
        this.disabled = disabled;
    }

    public String getDefaultValue() {
        return defaultValue;
    }

    public void setDefaultValue(String defaultValue) {
        this.defaultValue = defaultValue;
    }
}
