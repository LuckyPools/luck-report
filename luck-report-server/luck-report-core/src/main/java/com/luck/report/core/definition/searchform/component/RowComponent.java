package com.luck.report.core.definition.searchform.component;

import com.luck.report.core.definition.searchform.RenderContext;

import java.util.List;

public class RowComponent implements Component {
    public static final String KEY = "row_component";
    private String type;
    private Integer gutter;
    private String justify;
    private String align;
    private String tag;
    private Integer span;
    private String layout;
    private String tagIcon;
    private boolean layoutTree;
    private String document;
    private String formId;
    private String renderKey;
    private String componentName;
    private List<Component> children;

    @Override
    public String toHtml(RenderContext context) {
        return "";
    }

    @Override
    public String initJs(RenderContext context) {
        StringBuffer sb = new StringBuffer();
        if (children != null) {
            for (Component c : children) {
                sb.append(c.initJs(context));
            }
        }
        return sb.toString();
    }

    @Override
    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Integer getGutter() {
        return gutter;
    }

    public void setGutter(Integer gutter) {
        this.gutter = gutter;
    }

    public String getJustify() {
        return justify;
    }

    public void setJustify(String justify) {
        this.justify = justify;
    }

    public String getAlign() {
        return align;
    }

    public void setAlign(String align) {
        this.align = align;
    }

    public List<Component> getChildren() {
        return children;
    }

    public void setChildren(List<Component> children) {
        this.children = children;
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

    public boolean getLayoutTree() {
        return layoutTree;
    }

    public void setLayoutTree(Boolean layoutTree) {
        this.layoutTree = layoutTree;
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
}
