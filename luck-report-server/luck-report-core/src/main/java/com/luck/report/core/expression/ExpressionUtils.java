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
package com.luck.report.core.expression;

import com.luck.report.core.build.assertor.*;
import com.luck.report.core.definition.CellDefinition;
import com.luck.report.core.definition.ConditionPropertyItem;
import com.luck.report.core.dsl.ReportParserLexer;
import com.luck.report.core.dsl.ReportParserParser;
import com.luck.report.core.build.assertor.EqualsAssertor;
import com.luck.report.core.build.assertor.EqualsGreatThenAssertor;
import com.luck.report.core.build.assertor.GreatThenAssertor;
import com.luck.report.core.build.assertor.InAssertor;
import com.luck.report.core.definition.value.DatasetValue;
import com.luck.report.core.definition.value.ExpressionValue;
import com.luck.report.core.definition.value.Value;
import com.luck.report.core.exception.ReportParseException;
import com.luck.report.core.expression.function.Function;
import com.luck.report.core.expression.model.Condition;
import com.luck.report.core.expression.model.Expression;
import com.luck.report.core.expression.model.Op;
import com.luck.report.core.expression.parse.ExpressionErrorListener;
import com.luck.report.core.expression.parse.ExpressionVisitor;
import com.luck.report.core.expression.parse.builder.*;
import org.antlr.v4.runtime.ANTLRInputStream;
import org.antlr.v4.runtime.CommonTokenStream;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;

import java.util.*;

/**
 * @author Jacky.gao
 * @since 2016年12月24日
 */
public class ExpressionUtils implements ApplicationContextAware {
    public static final String EXPR_PREFIX = "${";
    public static final String EXPR_SUFFIX = "}";
    private static ExpressionVisitor exprVisitor;
    private static Map<String, Function> functions = new HashMap<String, Function>();
    private static Map<Op, Assertor> assertorsMap = new HashMap<Op, Assertor>();
    private static List<ExpressionBuilder> expressionBuilders = new ArrayList<ExpressionBuilder>();
    private static List<String> cellNameList = new ArrayList<String>();
    private static String[] LETTERS = {"A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"};

    static {
        expressionBuilders.add(new StringExpressionBuilder());
        expressionBuilders.add(new VariableExpressionBuilder());
        expressionBuilders.add(new BooleanExpressionBuilder());
        expressionBuilders.add(new IntegerExpressionBuilder());
        expressionBuilders.add(new DatasetExpressionBuilder());
        expressionBuilders.add(new FunctionExpressionBuilder());
        expressionBuilders.add(new NumberExpressionBuilder());
        expressionBuilders.add(new CellPositionExpressionBuilder());
        expressionBuilders.add(new RelativeCellExpressionBuilder());
        expressionBuilders.add(new SetExpressionBuilder());
        expressionBuilders.add(new CellObjectExpressionBuilder());
        expressionBuilders.add(new NullExpressionBuilder());
        expressionBuilders.add(new CurrentCellValueExpressionBuilder());
        expressionBuilders.add(new CurrentCellDataExpressionBuilder());

        assertorsMap.put(Op.Equals, new EqualsAssertor());
        assertorsMap.put(Op.EqualsGreatThen, new EqualsGreatThenAssertor());
        assertorsMap.put(Op.EqualsLessThen, new EqualsLessThenAssertor());
        assertorsMap.put(Op.GreatThen, new GreatThenAssertor());
        assertorsMap.put(Op.LessThen, new LessThenAssertor());
        assertorsMap.put(Op.NotEquals, new NotEqualsAssertor());
        assertorsMap.put(Op.In, new InAssertor());
        assertorsMap.put(Op.NotIn, new NotInAssertor());
        assertorsMap.put(Op.Like, new LikeAssertor());

        for (int i = 0; i < LETTERS.length; i++) {
            cellNameList.add(LETTERS[i]);
        }

        for (int i = 0; i < LETTERS.length; i++) {
            String name = LETTERS[i];
            for (int j = 0; j < LETTERS.length; j++) {
                cellNameList.add(name + LETTERS[j]);
            }
        }
    }

    public static List<String> getCellNameList() {
        return cellNameList;
    }

    public static Map<String, Function> getFunctions() {
        return functions;
    }

    public static Map<Op, Assertor> getAssertorsMap() {
        return assertorsMap;
    }

    public static boolean conditionEval(Op op, Object left, Object right) {
        Assertor assertor = assertorsMap.get(op);
        return assertor.eval(left, right);
    }

    public static Expression parseExpression(String text) {
        ANTLRInputStream antlrInputStream = new ANTLRInputStream(text);
        ReportParserLexer lexer = new ReportParserLexer(antlrInputStream);
        CommonTokenStream tokenStream = new CommonTokenStream(lexer);
        ReportParserParser parser = new ReportParserParser(tokenStream);
        ExpressionErrorListener errorListener = new ExpressionErrorListener();
        parser.addErrorListener(errorListener);
        exprVisitor = new ExpressionVisitor(expressionBuilders);
        Expression expression = exprVisitor.visitEntry(parser.entry());
        String error = errorListener.getErrorMessage();
        if (error != null) {
            throw new ReportParseException("Expression parse error:" + error);
        }
        return expression;
    }

    public static ExpressionVisitor getExprVisitor() {
        return exprVisitor;
    }

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        Collection<Function> coll = applicationContext.getBeansOfType(Function.class).values();
        for (Function fun : coll) {
            functions.put(fun.name(), fun);
        }
    }

    /**
     * 收集单元格定义中所有依赖的单元格名称（从条件属性、数据集过滤条件、表达式中提取）
     * @param cellDef 单元格定义
     * @param cellDefinitionMap 单元格定义索引（可为 null，为 null 时表达式提取不做名称有效性验证）
     * @return 依赖的单元格名称集合
     */
    public static Set<String> getDependencyCellNames(CellDefinition cellDef, Map<String, CellDefinition> cellDefinitionMap) {
        Set<String> result = new HashSet<String>();
        // 从条件属性中提取依赖单元格名
        List<ConditionPropertyItem> conditionPropertyItems = cellDef.getConditionPropertyItems();
        if (conditionPropertyItems != null && !conditionPropertyItems.isEmpty()) {
            for (ConditionPropertyItem item : conditionPropertyItems) {
                List<Condition> conditions = item.getConditions();
                if (conditions != null) {
                    result.addAll(getCellNamesFromConditions(conditions));
                }
                result.addAll(getCellNamesFromExpression(item.getExpression(), cellDefinitionMap));
            }
        }
        // 从值定义中提取依赖单元格名
        Value value = cellDef.getValue();
        if (value instanceof DatasetValue) {
            DatasetValue datasetValue = (DatasetValue) value;
            List<Condition> conditions = datasetValue.getConditions();
            if (conditions != null) {
                result.addAll(getCellNamesFromConditions(conditions));
            }
        } else if (value instanceof ExpressionValue) {
            ExpressionValue expressionValue = (ExpressionValue) value;
            result.addAll(getCellNamesFromExpression(expressionValue.getExpression(), cellDefinitionMap));
        }
        return result;
    }

    /**
     * 从 Expression 对象中提取引用的单元格名称（基于 AST 遍历）
     * @param expr 表达式对象
     * @param cellDefinitionMap 单元格定义索引（可为 null，为 null 时不验证名称有效性）
     * @return 提取到的单元格名称集合
     */
    public static Set<String> getCellNamesFromExpression(Expression expr, Map<String, CellDefinition> cellDefinitionMap) {
        Set<String> result = new HashSet<String>();
        if (expr == null) {
            return result;
        }
        List<String> list = expr.fetchCellName();
        for (String name : list) {
            if (cellDefinitionMap != null) {
                if (cellDefinitionMap.containsKey(name)) {
                    result.add(name);
                }
            } else {
                result.add(name);
            }
        }
        return result;
    }

    /**
     * 从条件列表中提取引用的单元格名称（基于 AST 遍历）
     * @param conditions 条件列表
     * @return 提取到的单元格名称集合
     */
    public static Set<String> getCellNamesFromConditions(List<Condition> conditions) {
        Set<String> result = new HashSet<String>();
        if (conditions == null || conditions.isEmpty()) {
            return result;
        }
        for (Condition condition : conditions) {
            result.addAll(condition.fetchCellName());
        }
        return result;
    }

}
