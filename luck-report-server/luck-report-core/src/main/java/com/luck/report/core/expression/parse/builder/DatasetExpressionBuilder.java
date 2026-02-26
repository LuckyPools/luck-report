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
package com.luck.report.core.expression.parse.builder;

import com.luck.report.core.definition.Order;
import com.luck.report.core.definition.value.AggregateType;
import com.luck.report.core.dsl.ReportParserParser.ConditionsContext;
import com.luck.report.core.dsl.ReportParserParser.DatasetContext;
import com.luck.report.core.dsl.ReportParserParser.UnitContext;
import com.luck.report.core.expression.model.condition.BaseCondition;
import com.luck.report.core.expression.model.expr.BaseExpression;
import com.luck.report.core.expression.model.expr.dataset.DatasetExpression;
import org.antlr.v4.runtime.tree.TerminalNode;

/**
 * @author Jacky.gao
 * @since 2016年12月26日
 */
public class DatasetExpressionBuilder extends BaseExpressionBuilder {
    @Override
    public BaseExpression build(UnitContext unitContext) {
        DatasetContext context = (DatasetContext) unitContext.dataset();
        DatasetExpression expr = new DatasetExpression();
        expr.setExpr(context.getText());
        expr.setDatasetName(context.Identifier().getText());
        expr.setAggregate(AggregateType.valueOf(context.aggregate().getText()));
        if (context.property() != null) {
            expr.setProperty(context.property().getText());
        }
        ConditionsContext conditionsContext = context.conditions();
        if (conditionsContext != null) {
            BaseCondition condition = buildConditions(conditionsContext);
            expr.setCondition(condition);
        }
        TerminalNode orderNode = context.ORDER();
        if (orderNode != null) {
            expr.setOrder(Order.valueOf(orderNode.getText()));
        }
        return expr;
    }

    @Override
    public boolean support(UnitContext unitContext) {
        return unitContext.dataset() != null;
    }
}
