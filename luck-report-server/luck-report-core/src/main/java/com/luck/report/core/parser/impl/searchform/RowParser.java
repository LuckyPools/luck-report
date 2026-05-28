package com.luck.report.core.parser.impl.searchform;

import com.luck.report.core.definition.searchform.component.Component;
import com.luck.report.core.definition.searchform.component.RowComponent;
import org.apache.commons.lang3.StringUtils;
import org.dom4j.Element;

import java.util.List;

public class RowParser implements FormParser<RowComponent> {
    @Override
    public RowComponent parse(Element element) {
        RowComponent row = new RowComponent();
        row.setType(element.attributeValue("type"));
        row.setJustify(element.attributeValue("justify"));
        row.setAlign(element.attributeValue("align"));
        row.setTag(element.attributeValue("tag"));
        String span = element.attributeValue("span");
        if (StringUtils.isNotBlank(span)) {
            row.setSpan(Integer.parseInt(span));
        }
        row.setLayout(element.attributeValue("layout"));
        row.setTagIcon(element.attributeValue("tagIcon"));

        String gutter = element.attributeValue("gutter");
        if (StringUtils.isNotBlank(gutter)) {
            row.setGutter(Integer.parseInt(gutter));
        }

        String layoutTree = element.attributeValue("layoutTree");
        if (StringUtils.isNotBlank(layoutTree)) {
            row.setLayoutTree(Boolean.parseBoolean(layoutTree));
        }

        row.setDocument(element.attributeValue("document"));
        row.setFormId(element.attributeValue("formId"));
        row.setRenderKey(element.attributeValue("renderKey"));
        row.setComponentName(element.attributeValue("componentName"));

        List<Component> children = FormParserUtils.parse(element);
        row.setChildren(children);

        return row;
    }

    @Override
    public boolean support(String name) {
        return name.equals("row");
    }
}
