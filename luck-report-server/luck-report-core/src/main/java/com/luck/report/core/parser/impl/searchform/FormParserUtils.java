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

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.luck.report.core.definition.searchform.component.Component;
import org.dom4j.Element;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;

import java.util.*;

/**
 * @author Jacky.gao
 * @since 2017年10月24日
 */
public class FormParserUtils implements ApplicationContextAware {
    @SuppressWarnings("rawtypes")
    private static Collection<FormParser> parsers = null;
    private static final ObjectMapper objectMapper = new ObjectMapper();

    public static List<Component> parse(Element element) {
        List<Component> list = new ArrayList<Component>();
        for (Object obj : element.elements()) {
            if (obj == null || !(obj instanceof Element)) {
                continue;
            }
            Element ele = (Element) obj;
            String name = ele.getName();
            FormParser<?> targetParser = null;
            for (FormParser<?> parser : parsers) {
                if (parser.support(name)) {
                    targetParser = parser;
                    break;
                }
            }
            if (targetParser == null) {
                continue;
            }
            list.add((Component) targetParser.parse(ele));
        }
        return list;
    }

    public static Map<String, String> parseStyle(String styleStr) {
        if (styleStr == null || styleStr.trim().isEmpty()) {
            return null;
        }
        try {
            Map<String, String> styleMap = objectMapper.readValue(styleStr, new TypeReference<Map<String, String>>(){});
            return styleMap;
        } catch (Exception e) {
            return null;
        }
    }

    public static List<String> parseStringList(String regListStr) {
        if (regListStr == null || regListStr.trim().isEmpty()) {
            return null;
        }
        try {
            return objectMapper.readValue(regListStr, new TypeReference<List<String>>(){});
        } catch (Exception e) {
            return null;
        }
    }

    public static String parseStringAttribute(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        if ("null".equals(value)) {
            return null;
        }
        return value;
    }

    public static Boolean parseBooleanAttribute(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        if ("null".equals(value)) {
            return null;
        }
        return Boolean.parseBoolean(value);
    }

    public static Integer parseIntAttribute(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        if ("null".equals(value)) {
            return null;
        }
        try {
            return Integer.parseInt(value);
        } catch (Exception e) {
            return null;
        }
    }

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        FormParserUtils.parsers = applicationContext.getBeansOfType(FormParser.class).values();
    }
}
