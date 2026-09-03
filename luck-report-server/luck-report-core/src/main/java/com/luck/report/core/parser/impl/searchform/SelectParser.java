package com.luck.report.core.parser.impl.searchform;

import com.luck.report.core.definition.searchform.Option;
import com.luck.report.core.definition.searchform.component.SelectComponent;
import org.dom4j.Element;

import java.util.ArrayList;
import java.util.List;

public class SelectParser implements FormParser<SelectComponent> {
    @Override
    public SelectComponent parse(Element element) {
        SelectComponent select = new SelectComponent();
        select.setLabel(FormParserUtils.parseStringAttribute(element.attributeValue("label")));
        select.setPlaceholder(FormParserUtils.parseStringAttribute(element.attributeValue("placeholder")));
        select.setStyle(FormParserUtils.parseStyle(element.attributeValue("style")));
        select.setTag(FormParserUtils.parseStringAttribute(element.attributeValue("tag")));
        select.setTagIcon(FormParserUtils.parseStringAttribute(element.attributeValue("tagIcon")));

        select.setMultiple(FormParserUtils.parseBooleanAttribute(element.attributeValue("multiple")));
        select.setClearable(FormParserUtils.parseBooleanAttribute(element.attributeValue("clearable")));
        select.setFilterable(FormParserUtils.parseBooleanAttribute(element.attributeValue("filterable")));

        select.setSpan(FormParserUtils.parseIntAttribute(element.attributeValue("span")));
        select.setLabelWidth(FormParserUtils.parseStringAttribute(element.attributeValue("labelWidth")));

        select.setRequired(FormParserUtils.parseBooleanAttribute(element.attributeValue("required")));
        select.setRegList(FormParserUtils.parseStringList(element.attributeValue("regList")));
        select.setChangeTag(FormParserUtils.parseBooleanAttribute(element.attributeValue("changeTag")));

        select.setDocument(FormParserUtils.parseStringAttribute(element.attributeValue("document")));
        select.setFormId(FormParserUtils.parseStringAttribute(element.attributeValue("formId")));
        select.setRenderKey(FormParserUtils.parseStringAttribute(element.attributeValue("renderKey")));
        select.setVModel(FormParserUtils.parseStringAttribute(element.attributeValue("vModel")));
        select.setDefaultValue(FormParserUtils.parseMultiValueAttribute(element.attributeValue("defaultValue")));
        select.setLayout(FormParserUtils.parseStringAttribute(element.attributeValue("layout")));
        select.setOptionSource(FormParserUtils.parseStringAttribute(element.attributeValue("optionSource")));
        select.setDatasetOption(FormParserUtils.parseDatasetOption(element));

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
        select.setOptions(options);

        return select;
    }

    @Override
    public boolean support(String name) {
        return name.equals("select");
    }
}
