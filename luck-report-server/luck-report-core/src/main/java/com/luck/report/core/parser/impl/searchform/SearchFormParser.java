/*******************************************************************************
 * Copyright 2017 Bstek
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License.  You may obtain a copy
 * of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
 * License for the specific language governing permissions and limitations under
 * the License.
 ******************************************************************************/
package com.luck.report.core.parser.impl.searchform;

import com.luck.report.core.definition.searchform.SearchForm;
import com.luck.report.core.definition.searchform.component.Component;
import com.luck.report.core.parser.Parser;
import org.dom4j.Element;

import java.util.List;

public class SearchFormParser implements Parser<SearchForm> {
    @Override
    public SearchForm parse(Element element) {
        SearchForm form = new SearchForm();
        form.setFormRef(FormParserUtils.parseStringAttribute(element.attributeValue("formRef")));
        form.setTag(FormParserUtils.parseStringAttribute(element.attributeValue("tag")));
        form.setFormModel(FormParserUtils.parseStringAttribute(element.attributeValue("formModel")));
        form.setSize(FormParserUtils.parseStringAttribute(element.attributeValue("size")));
        form.setLabelPosition(FormParserUtils.parseStringAttribute(element.attributeValue("labelPosition")));
        form.setLabelWidth(FormParserUtils.parseIntAttribute(element.attributeValue("labelWidth")));
        form.setFormRules(FormParserUtils.parseStringAttribute(element.attributeValue("formRules")));
        form.setGutter(FormParserUtils.parseIntAttribute(element.attributeValue("gutter")));
        form.setSpan(FormParserUtils.parseIntAttribute(element.attributeValue("span")));

        form.setDisabled(FormParserUtils.parseBooleanAttribute(element.attributeValue("disabled")));
        form.setFormBtns(FormParserUtils.parseBooleanAttribute(element.attributeValue("formBtns")));

        List<Component> fields = FormParserUtils.parse(element);
        form.setFields(fields);
        return form;
    }
}
