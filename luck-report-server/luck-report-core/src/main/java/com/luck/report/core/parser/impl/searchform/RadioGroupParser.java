package com.luck.report.core.parser.impl.searchform;

import com.luck.report.core.definition.searchform.Option;
import com.luck.report.core.definition.searchform.component.RadioGroupComponent;
import org.dom4j.Element;

import java.util.ArrayList;
import java.util.List;

public class RadioGroupParser implements FormParser<RadioGroupComponent> {
    @Override
    public RadioGroupComponent parse(Element element) {
        RadioGroupComponent component = new RadioGroupComponent();
        component.setLabel(FormParserUtils.parseStringAttribute(element.attributeValue("label")));
        component.setOptionType(FormParserUtils.parseStringAttribute(element.attributeValue("optionType")));
        component.setSize(FormParserUtils.parseStringAttribute(element.attributeValue("size")));
        component.setTag(FormParserUtils.parseStringAttribute(element.attributeValue("tag")));
        
        component.setDisabled(FormParserUtils.parseBooleanAttribute(element.attributeValue("disabled")));
        component.setBorder(FormParserUtils.parseBooleanAttribute(element.attributeValue("border")));

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
        
        List<Option> options = new ArrayList<Option>();
        for (Object obj : element.elements()) {
            if (obj == null || !(obj instanceof Element)) {
                continue;
            }
            Element ele = (Element) obj;
            if (!ele.getName().equals("option")) {
                continue;
            }
            Option option = new Option();
            options.add(option);
            option.setLabel(FormParserUtils.parseStringAttribute(ele.attributeValue("label")));
            option.setValue(FormParserUtils.parseStringAttribute(ele.attributeValue("value")));
        }
        component.setOptions(options);
        
        return component;
    }

    @Override
    public boolean support(String name) {
        return name.equals("radio-group");
    }
}
