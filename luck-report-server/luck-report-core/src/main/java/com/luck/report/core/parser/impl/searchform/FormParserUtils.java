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
import com.luck.report.core.definition.searchform.DatasetOption;
import com.luck.report.core.definition.searchform.DatasetParam;
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

    /**
     * 方法说明：解析多值属性为逗号拼接字符串，多选组件默认值统一字符串存储；兼容历史 JSON 数组格式（["a","b"] 转为 a,b），普通字符串原样返回
     * @param value XML 属性值，String 类型，可为空
     * @return 逗号拼接字符串，空值返回 null
     */
    public static String parseMultiValueAttribute(String value) {
        String str = parseStringAttribute(value);
        if (str == null) {
            return null;
        }
        String trimmed = str.trim();
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            List<String> list = parseStringList(trimmed);
            if (list != null) {
                return String.join(",", list);
            }
        }
        return str;
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

    /**
     * 将 XML 属性中的 JSON 字符串反序列化为指定类型对象
     *
     * @param value XML 属性值（JSON 字符串），可为空，为空时返回 null
     * @param clazz 目标类型，不可为空
     * @return 反序列化后的对象；解析失败时返回 null
     */
    public static <T> T parseObjectAttribute(String value, Class<T> clazz) {
        if (value == null || value.trim().isEmpty() || "null".equals(value)) {
            return null;
        }
        try {
            return objectMapper.readValue(value, clazz);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * 方法说明：从 XML 子元素解析 datasetOption 配置，解析 <datasetOption> 子标签及其内部 <datasetParam> 子标签
     * @param element 父元素（select/radio-group/checkbox-group），Element 类型，不可为空
     * @return DatasetOption 对象，无 datasetOption 子标签时返回 null
     */
    public static DatasetOption parseDatasetOption(Element element) {
        Element dsElement = element.element("datasetOption");
        if (dsElement == null) {
            return null;
        }
        DatasetOption ds = new DatasetOption();
        ds.setDatasourceName(parseStringAttribute(dsElement.attributeValue("datasourceName")));
        ds.setDatasetName(parseStringAttribute(dsElement.attributeValue("datasetName")));
        ds.setLabelField(parseStringAttribute(dsElement.attributeValue("labelField")));
        ds.setValueField(parseStringAttribute(dsElement.attributeValue("valueField")));

        List<DatasetParam> params = new ArrayList<>();
        for (Object obj : dsElement.elements("datasetParam")) {
            if (obj == null || !(obj instanceof Element)) {
                continue;
            }
            Element paramEle = (Element) obj;
            DatasetParam param = new DatasetParam();
            param.setParamKey(parseStringAttribute(paramEle.attributeValue("paramKey")));
            param.setParentField(parseStringAttribute(paramEle.attributeValue("parentField")));
            params.add(param);
        }
        ds.setDatasetParams(params);
        return ds;
    }

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        FormParserUtils.parsers = applicationContext.getBeansOfType(FormParser.class).values();
    }
}
