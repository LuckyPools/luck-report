package com.luck.report.core.parser.impl.searchform;

import com.luck.report.core.definition.searchform.component.ButtonComponent;
import org.dom4j.Element;

public class ButtonParser implements FormParser<ButtonComponent> {
    @Override
    public ButtonComponent parse(Element element) {
        ButtonComponent button = new ButtonComponent();
        button.setLabel(FormParserUtils.parseStringAttribute(element.attributeValue("label")));
        button.setType(FormParserUtils.parseStringAttribute(element.attributeValue("type")));
        button.setSize(FormParserUtils.parseStringAttribute(element.attributeValue("size")));
        button.setIcon(FormParserUtils.parseStringAttribute(element.attributeValue("icon")));
        button.setTag(FormParserUtils.parseStringAttribute(element.attributeValue("tag")));
        
        button.setDisabled(FormParserUtils.parseBooleanAttribute(element.attributeValue("disabled")));
        button.setChangeTag(FormParserUtils.parseBooleanAttribute(element.attributeValue("changeTag")));

        button.setSpan(FormParserUtils.parseIntAttribute(element.attributeValue("span")));
        button.setLayout(FormParserUtils.parseStringAttribute(element.attributeValue("layout")));
        button.setTagIcon(FormParserUtils.parseStringAttribute(element.attributeValue("tagIcon")));
        button.setDefaultValue(FormParserUtils.parseStringAttribute(element.attributeValue("defaultValue")));
        button.setDocument(FormParserUtils.parseStringAttribute(element.attributeValue("document")));
        button.setFormId(FormParserUtils.parseStringAttribute(element.attributeValue("formId")));
        button.setRenderKey(FormParserUtils.parseStringAttribute(element.attributeValue("renderKey")));
        button.setVModel(FormParserUtils.parseStringAttribute(element.attributeValue("vModel")));
        
        return button;
    }

    @Override
    public boolean support(String name) {
        return name.equals("button");
    }
}
