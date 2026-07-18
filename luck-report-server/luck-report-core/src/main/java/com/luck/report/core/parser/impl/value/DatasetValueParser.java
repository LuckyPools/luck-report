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
package com.luck.report.core.parser.impl.value;

import com.luck.report.core.definition.Order;
import com.luck.report.core.definition.mapping.MappingItem;
import com.luck.report.core.definition.mapping.MappingType;
import com.luck.report.core.definition.value.AggregateType;
import com.luck.report.core.definition.value.DatasetValue;
import com.luck.report.core.definition.value.GroupItem;
import com.luck.report.core.definition.value.Value;
import com.luck.report.core.expression.ExpressionUtils;
import com.luck.report.core.expression.model.Condition;
import com.luck.report.core.expression.model.Op;
import com.luck.report.core.expression.model.condition.Join;
import com.luck.report.core.expression.model.condition.PropertyExpressionCondition;
import org.apache.commons.lang3.StringUtils;
import org.dom4j.Element;

import java.util.ArrayList;
import java.util.List;

/**
 * @author Jacky.gao
 * @since 2016年12月21日
 */
public class DatasetValueParser extends ValueParser {
    @Override
    public Value parse(Element element) {
        DatasetValue value = new DatasetValue();
        value.setAggregate(AggregateType.valueOf(element.attributeValue("aggregate")));
        value.setDatasetName(element.attributeValue("dataset-name"));
        value.setProperty(element.attributeValue("property"));
        String order = element.attributeValue("order");
        if (StringUtils.isNotBlank(order)) {
            value.setOrder(Order.valueOf(order));
        }
        String mappingType = element.attributeValue("mapping-type");
        if (StringUtils.isNotBlank(mappingType)) {
            value.setMappingType(MappingType.valueOf(mappingType));
        }
        value.setMappingDataset(element.attributeValue("mapping-dataset"));
        value.setMappingKeyProperty(element.attributeValue("mapping-key-property"));
        value.setMappingValueProperty(element.attributeValue("mapping-value-property"));
        List<GroupItem> groupItems = null;
        List<MappingItem> mappingItems = null;
        List<Condition> conditions = new ArrayList<Condition>();
        for (Object obj : element.elements()) {
            if (obj == null || !(obj instanceof Element)) {
                continue;
            }
            Element ele = (Element) obj;
            if (ele.getName().equals("condition")) {
                PropertyExpressionCondition condition = parseCondition(ele);
                conditions.add(condition);
            } else if (ele.getName().equals("group-item")) {
                if (groupItems == null) {
                    groupItems = new ArrayList<>();
                    value.setGroupItems(groupItems);
                }
                GroupItem item = new GroupItem();
                item.setName(ele.attributeValue("name"));
                groupItems.add(item);
                List<Condition> itemConditions = new ArrayList<>();
                for (Object o : ele.elements()) {
                    if (o == null || !(o instanceof Element)) {
                        continue;
                    }
                    PropertyExpressionCondition itemCondition = parseCondition((Element) o);
                    itemConditions.add(itemCondition);
                }
                item.setConditions(itemConditions);
            } else if (ele.getName().equals("mapping-item")) {
                MappingItem item = new MappingItem();
                item.setLabel(ele.attributeValue("label"));
                item.setValue(ele.attributeValue("value"));
                if (mappingItems == null) {
                    mappingItems = new ArrayList<>();
                }
                mappingItems.add(item);
            }
        }
        value.setConditions(conditions);
        if (mappingItems != null) {
            value.setMappingItems(mappingItems);
        }
        return value;
    }

    private PropertyExpressionCondition parseCondition(Element ele) {
        PropertyExpressionCondition condition = new PropertyExpressionCondition();
        String property = ele.attributeValue("property");
        condition.setLeftProperty(property);
        condition.setLeft(property);
        String operation = ele.attributeValue("op");
        condition.setOperation(operation);
        condition.setOp(Op.parse(operation));
        for (Object o : ele.elements()) {
            if (o == null || !(o instanceof Element)) {
                continue;
            }
            Element e = (Element) o;
            if (!e.getName().equals("value")) {
                continue;
            }
            String expr = e.getTextTrim();
            condition.setRight(expr);
            break;
        }
        String join = ele.attributeValue("join");
        if (StringUtils.isNotBlank(join)) {
            condition.setJoin(Join.valueOf(join));
        }
        return condition;
    }
}
