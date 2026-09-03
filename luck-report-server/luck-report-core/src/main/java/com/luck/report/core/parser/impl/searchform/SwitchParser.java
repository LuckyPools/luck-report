package com.luck.report.core.parser.impl.searchform;

import com.luck.report.core.definition.searchform.component.SwitchComponent;
import org.dom4j.Element;

public class SwitchParser implements FormParser<SwitchComponent> {
    @Override
    public SwitchComponent parse(Element element) {
        SwitchComponent component = new SwitchComponent();
        component.setLabel(FormParserUtils.parseStringAttribute(element.attributeValue("label")));
        component.setActiveColor(FormParserUtils.parseStringAttribute(element.attributeValue("activeColor")));
        component.setInactiveColor(FormParserUtils.parseStringAttribute(element.attributeValue("inactiveColor")));
        component.setTag(FormParserUtils.parseStringAttribute(element.attributeValue("tag")));
        component.setTagIcon(FormParserUtils.parseStringAttribute(element.attributeValue("tagIcon")));
        
        component.setActiveValue(FormParserUtils.parseBooleanAttribute(element.attributeValue("activeValue")));
        component.setInactiveValue(FormParserUtils.parseBooleanAttribute(element.attributeValue("inactiveValue")));

        component.setSpan(FormParserUtils.parseIntAttribute(element.attributeValue("span")));
        component.setLabelWidth(FormParserUtils.parseStringAttribute(element.attributeValue("labelWidth")));
        component.setStyle(FormParserUtils.parseStyle(element.attributeValue("style")));
        
        component.setRequired(FormParserUtils.parseBooleanAttribute(element.attributeValue("required")));
        component.setRegList(FormParserUtils.parseStringList(element.attributeValue("regList")));
        component.setChangeTag(FormParserUtils.parseBooleanAttribute(element.attributeValue("changeTag")));
        
        component.setDocument(FormParserUtils.parseStringAttribute(element.attributeValue("document")));
        component.setFormId(FormParserUtils.parseStringAttribute(element.attributeValue("formId")));
        component.setRenderKey(FormParserUtils.parseStringAttribute(element.attributeValue("renderKey")));
        component.setVModel(FormParserUtils.parseStringAttribute(element.attributeValue("vModel")));
        
        component.setDefaultValue(FormParserUtils.parseStringAttribute(element.attributeValue("defaultValue")));
        
        component.setLayout(FormParserUtils.parseStringAttribute(element.attributeValue("layout")));
        
        return component;
    }

    @Override
    public boolean support(String name) {
        return name.equals("switch");
    }
}
