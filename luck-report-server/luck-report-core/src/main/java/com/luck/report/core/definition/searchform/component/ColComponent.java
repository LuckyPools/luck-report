package com.luck.report.core.definition.searchform.component;

import com.luck.report.core.definition.searchform.RenderContext;

public class ColComponent extends ContainerComponent {
    private Integer span;
    private String offset;
    private String push;
    private String pull;
    private String layout;
    private String tagIcon;
    private String document;
    private String formId;
    private String renderKey;
    private String componentName;

    @Override
    public String toHtml(RenderContext context) {
        return "";
    }

    @Override
    public String initJs(RenderContext context) {
        return "";
    }

    public Integer getSpan() {
        return span;
    }

    public void setSpan(Integer span) {
        this.span = span;
    }

    public String getOffset() {
        return offset;
    }

    public void setOffset(String offset) {
        this.offset = offset;
    }

    public String getPush() {
        return push;
    }

    public void setPush(String push) {
        this.push = push;
    }

    public String getPull() {
        return pull;
    }

    public void setPull(String pull) {
        this.pull = pull;
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

    public String getComponentName() {
        return componentName;
    }

    public void setComponentName(String componentName) {
        this.componentName = componentName;
    }

    @Override
    public String getType() {
        return null;
    }

    @Override
    public void setType(String type) {
        // ColComponent 不需要设置 type
    }
}
