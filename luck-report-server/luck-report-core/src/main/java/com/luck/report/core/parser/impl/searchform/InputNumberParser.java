package com.luck.report.core.parser.impl.searchform;

import com.luck.report.core.definition.searchform.component.InputNumberComponent;
import org.dom4j.Element;

public class InputNumberParser implements FormParser<InputNumberComponent> {
    @Override
    public InputNumberComponent parse(Element element) {
        InputNumberComponent component = new InputNumberComponent();
        component.setLabel(FormParserUtils.parseStringAttribute(element.attributeValue("label")));
        component.setControlsPosition(FormParserUtils.parseStringAttribute(element.attributeValue("controlsPosition")));
        component.setTag(FormParserUtils.parseStringAttribute(element.attributeValue("tag")));

        component.setStepStrictly(FormParserUtils.parseBooleanAttribute(element.attributeValue("stepStrictly")));
        component.setDisabled(FormParserUtils.parseBooleanAttribute(element.attributeValue("disabled")));

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
        return name.equals("input-number");
    }
}
