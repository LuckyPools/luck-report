package com.luck.report.core.parser.impl.searchform;

import com.luck.report.core.definition.searchform.component.ColComponent;
import com.luck.report.core.definition.searchform.component.Component;
import org.apache.commons.lang.StringUtils;
import org.dom4j.Element;

import java.util.List;

public class ColParser implements FormParser<ColComponent> {
    @Override
    public ColComponent parse(Element element) {
        ColComponent col = new ColComponent();
        String span = element.attributeValue("span");
        if (StringUtils.isNotBlank(span)) {
            col.setSpan(Integer.parseInt(span));
        }
        col.setOffset(element.attributeValue("offset"));
        col.setPush(element.attributeValue("push"));
        col.setPull(element.attributeValue("pull"));
        col.setTag(element.attributeValue("tag"));
        col.setLayout(element.attributeValue("layout"));
        col.setTagIcon(element.attributeValue("tagIcon"));
        col.setDocument(element.attributeValue("document"));
        col.setFormId(element.attributeValue("formId"));
        col.setRenderKey(element.attributeValue("renderKey"));
        col.setComponentName(element.attributeValue("componentName"));
        
        List<Component> children = FormParserUtils.parse(element);
        col.setChildren(children);
        
        return col;
    }

    @Override
    public boolean support(String name) {
        return name.equals("col");
    }
}
