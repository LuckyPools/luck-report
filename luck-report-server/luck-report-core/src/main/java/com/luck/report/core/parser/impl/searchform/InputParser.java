package com.luck.report.core.parser.impl.searchform;

import com.luck.report.core.definition.searchform.component.InputComponent;
import org.dom4j.Element;

public class InputParser implements FormParser<InputComponent> {
    @Override
    public InputComponent parse(Element element) {
        InputComponent component = new InputComponent();
        component.setLabel(FormParserUtils.parseStringAttribute(element.attributeValue("label")));
        component.setPlaceholder(FormParserUtils.parseStringAttribute(element.attributeValue("placeholder")));
        component.setTag(FormParserUtils.parseStringAttribute(element.attributeValue("tag")));

        component.setClearable(FormParserUtils.parseBooleanAttribute(element.attributeValue("clearable")));
        component.setDisabled(FormParserUtils.parseBooleanAttribute(element.attributeValue("disabled")));
        component.setReadonly(FormParserUtils.parseBooleanAttribute(element.attributeValue("readonly")));
        component.setMaxlength(FormParserUtils.parseStringAttribute(element.attributeValue("maxlength")));
        component.setShowWordLimit(FormParserUtils.parseBooleanAttribute(element.attributeValue("showWordLimit")));

        component.setPrepend(FormParserUtils.parseStringAttribute(element.attributeValue("prepend")));
        component.setAppend(FormParserUtils.parseStringAttribute(element.attributeValue("append")));
        component.setPrefixIcon(FormParserUtils.parseStringAttribute(element.attributeValue("prefixIcon")));
        component.setSuffixIcon(FormParserUtils.parseStringAttribute(element.attributeValue("suffixIcon")));
        component.setTagIcon(FormParserUtils.parseStringAttribute(element.attributeValue("tagIcon")));

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
        return name.equals("input");
    }
}
