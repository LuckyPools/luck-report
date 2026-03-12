package com.luck.report.core.parser.impl.searchform;

import com.luck.report.core.definition.searchform.component.DatePickerComponent;
import org.dom4j.Element;

public class DatePickerParser implements FormParser<DatePickerComponent> {
    @Override
    public DatePickerComponent parse(Element element) {
        DatePickerComponent component = new DatePickerComponent();
        component.setLabel(FormParserUtils.parseStringAttribute(element.attributeValue("label")));
        component.setType(FormParserUtils.parseStringAttribute(element.attributeValue("type")));
        component.setFormat(FormParserUtils.parseStringAttribute(element.attributeValue("format")));
        component.setPlaceholder(FormParserUtils.parseStringAttribute(element.attributeValue("placeholder")));
        component.setValueFormat(FormParserUtils.parseStringAttribute(element.attributeValue("valueFormat")));
        component.setTag(FormParserUtils.parseStringAttribute(element.attributeValue("tag")));
        component.setTagIcon(FormParserUtils.parseStringAttribute(element.attributeValue("tagIcon")));
        
        component.setClearable(FormParserUtils.parseBooleanAttribute(element.attributeValue("clearable")));
        component.setDisabled(FormParserUtils.parseBooleanAttribute(element.attributeValue("disabled")));
        component.setReadonly(FormParserUtils.parseBooleanAttribute(element.attributeValue("readonly")));

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
        return name.equals("date-picker");
    }
}
