package com.luck.report.core.definition.searchform.component;

import com.luck.report.core.definition.searchform.RenderContext;


public class InputComponent extends BaseInputComponent {
    private static final long serialVersionUID = 1L;
    private String placeholder;
    private boolean clearable;
    private String maxlength;
    private boolean showWordLimit;
    private String prepend;
    private String append;
    private String prefixIcon;
    private String suffixIcon;
    private String defaultValue;

    /**
     * 默认无参构造器
     */
    public InputComponent() {}

    @Override
    public String initJs(RenderContext context) {
        return "";
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

    public String getMaxlength() {
        return maxlength;
    }

    public void setMaxlength(String maxlength) {
        this.maxlength = maxlength;
    }

    public boolean isShowWordLimit() {
        return showWordLimit;
    }

    public void setShowWordLimit(boolean showWordLimit) {
        this.showWordLimit = showWordLimit;
    }

    public String getPrepend() {
        return prepend;
    }

    public void setPrepend(String prepend) {
        this.prepend = prepend;
    }

    public String getAppend() {
        return append;
    }

    public void setAppend(String append) {
        this.append = append;
    }

    public String getPrefixIcon() {
        return prefixIcon;
    }

    public void setPrefixIcon(String prefixIcon) {
        this.prefixIcon = prefixIcon;
    }

    public String getSuffixIcon() {
        return suffixIcon;
    }

    public void setSuffixIcon(String suffixIcon) {
        this.suffixIcon = suffixIcon;
    }

    public String getDefaultValue() {
        return defaultValue;
    }

    public void setDefaultValue(String defaultValue) {
        this.defaultValue = defaultValue;
    }
}
