package com.luck.report.core.definition.searchform.component;

import com.luck.report.core.definition.searchform.RenderContext;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

public abstract class BaseInputComponent implements Component {

    private String label;
    private String tag;
    private String tagIcon;
    private Integer span;
    private String labelWidth;
    private Map<String, String> style;
    private boolean required;
    private List<String> regList;
    private boolean changeTag;
    private String document;
    private String formId;
    private String renderKey;

    @JsonProperty("vModel")
    private String vModel;
    private String layout;

    @Override
    public String toHtml(RenderContext context) {
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
        return null;
    }

    public String getTag() {
        return tag;
    }

    public void setTag(String tag) {
        this.tag = tag;
    }

    public String getTagIcon() {
        return tagIcon;
    }

    public void setTagIcon(String tagIcon) {
        this.tagIcon = tagIcon;
    }

    public Integer getSpan() {
        return span;
    }

    public void setSpan(Integer span) {
        this.span = span;
    }

    public String getLabelWidth() {
        return labelWidth;
    }

    public void setLabelWidth(String labelWidth) {
        this.labelWidth = labelWidth;
    }

    public Map<String, String> getStyle() {
        return style;
    }

    public void setStyle(Map<String, String> style) {
        this.style = style;
    }

    public boolean getRequired() {
        return required;
    }

    public void setRequired(Boolean required) {
        this.required = required;
    }

    public List<String> getRegList() {
        return regList;
    }

    public void setRegList(List<String> regList) {
        this.regList = regList;
    }

    public boolean getChangeTag() {
        return changeTag;
    }

    public void setChangeTag(Boolean changeTag) {
        this.changeTag = changeTag;
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

    public String getLayout() {
        return layout;
    }

    public void setLayout(String layout) {
        this.layout = layout;
    }
}
