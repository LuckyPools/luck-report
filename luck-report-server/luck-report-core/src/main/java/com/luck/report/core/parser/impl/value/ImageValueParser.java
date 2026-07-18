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

import com.luck.report.core.definition.value.ImageValue;
import com.luck.report.core.definition.value.Source;
import com.luck.report.core.definition.value.Value;
import com.luck.report.core.expression.ExpressionUtils;
import com.luck.report.core.expression.model.Expression;
import org.apache.commons.lang3.StringUtils;
import org.dom4j.Element;

/**
 * @author Jacky.gao
 * @since 2017年3月6日
 */
public class ImageValueParser extends ValueParser {

    @Override
    public Value parse(Element element) {
        ImageValue value = new ImageValue();
        String width = element.attributeValue("width");
        if (StringUtils.isNotBlank(width)) {
            value.setWidth(Integer.valueOf(width));
        }
        String height = element.attributeValue("height");
        if (StringUtils.isNotBlank(height)) {
            value.setHeight(Integer.valueOf(height));
        }
        Source source = Source.valueOf(element.attributeValue("source"));
        value.setSource(source);
        for (Object obj : element.elements()) {
            if (obj == null || !(obj instanceof Element)) {
                continue;
            }
            Element ele = (Element) obj;
            if (ele.getName().equals("text")) {
                if (source.equals(Source.text)) {
                    value.setPath(ele.getText());
                } else {
                    value.setExpr(ele.getText());
                }
                break;
            }
        }
        if (source.equals(Source.expression)) {
            String expr = value.getExpr();
            Expression expression = ExpressionUtils.parseExpression(expr);
            value.setExpression(expression);
        }
        return value;
    }
}
