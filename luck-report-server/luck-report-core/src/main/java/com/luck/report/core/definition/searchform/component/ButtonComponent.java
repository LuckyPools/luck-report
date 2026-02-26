package com.luck.report.core.definition.searchform.component;

import com.luck.report.core.definition.searchform.RenderContext;
import org.codehaus.jackson.annotate.JsonIgnore;
import org.codehaus.jackson.annotate.JsonProperty;

public class ButtonComponent implements Component {
    private String label;
    private String type;
    private String size;
    private String icon;
    private boolean disabled;
    private String tag;
    private Integer span;
    private String layout;
    private String tagIcon;
    private boolean changeTag;
    private String defaultValue;
    private String document;
    private String formId;
    private String renderKey;

    @JsonProperty("vModel")
    private String vModel;

    @Override
    public String toHtml(RenderContext context) {
        return "";
    }

    @Override
    public String initJs(RenderContext context) {
        return "";
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    @Override
    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getSize() {
        return size;
    }

    public void setSize(String size) {
        this.size = size;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public boolean isDisabled() {
        return disabled;
    }

    public void setDisabled(boolean disabled) {
        this.disabled = disabled;
    }

    public String getTag() {
        return tag;
    }

    public void setTag(String tag) {
        this.tag = tag;
    }

    public Integer getSpan() {
        return span;
    }

    public void setSpan(Integer span) {
        this.span = span;
    }

    public String getLayout() {
        return layout;
    }

    public void setLayout(String layout) {
        this.layout = layout;
    }

    public String getTagIcon() {
        return tagIcon;
    }

    public void setTagIcon(String tagIcon) {
        this.tagIcon = tagIcon;
    }

    public String getDefaultValue() {
        return defaultValue;
    }

    public void setDefaultValue(String defaultValue) {
        this.defaultValue = defaultValue;
    }

    public String getDocument() {
        return document;
    }

    public void setDocument(String document) {
        this.document = document;
    }

    public String getFormId() {
        return formId;
    }

    public void setFormId(String formId) {
        this.formId = formId;
    }

    public String getRenderKey() {
        return renderKey;
    }

    public void setRenderKey(String renderKey) {
        this.renderKey = renderKey;
    }

    @JsonIgnore
    public String getVModel() {
        return vModel;
    }

    public void setVModel(String vModel) {
        this.vModel = vModel;
    }

    public boolean isChangeTag() {
        return changeTag;
    }

    public void setChangeTag(boolean changeTag) {
        this.changeTag = changeTag;
    }
}
