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
package com.luck.report.core.expression.model.expr.ifelse;

import com.luck.report.core.build.Context;
import com.luck.report.core.expression.model.condition.Join;
import com.luck.report.core.model.Cell;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

/**
 * @author Jacky.gao
 * @since 2017年1月16日
 */
public class ExpressionConditionList implements Serializable {
    private static final long serialVersionUID = 1L;
    private List<ExpressionCondition> conditions;
    private List<Join> joins;

    public ExpressionConditionList() {}

    public ExpressionConditionList(List<ExpressionCondition> conditions, List<Join> joins) {
        this.conditions = conditions;
        this.joins = joins;
    }

    public boolean eval(Context context, Cell cell, Cell currentCell) {
        if (conditions.size() == 1) {
            return conditions.get(0).eval(context, cell, currentCell);
        }
        for (int i = 0; i < conditions.size(); i++) {
            ExpressionCondition condition = conditions.get(i);
            boolean result = condition.eval(context, cell, currentCell);
            Join join = null;
            if (i < joins.size()) {
                join = joins.get(i);
            }
            if (join == null) {
                return result;
            } else {
                if (join.equals(Join.and) && !result) {
                    return false;
                }
                if (join.equals(Join.or) && result) {
                    return true;
                }
            }
        }
        return true;
    }

    public List<ExpressionCondition> getConditions() {
        return conditions;
    }

    /**
     * 设置条件列表
     * @param conditions 条件列表
     */
    public void setConditions(List<ExpressionCondition> conditions) {
        this.conditions = conditions;
    }

    /**
     * 获取连接符列表
     * @return 连接符列表
     */
    public List<Join> getJoins() {
        return joins;
    }

    /**
     * 设置连接符列表
     * @param joins 连接符列表
     */
    public void setJoins(List<Join> joins) {
        this.joins = joins;
    }

    public List<String> fetchCellName() {
        List<String> list = new ArrayList<String>();
        if (conditions == null || conditions.size() == 0) {
            return list;
        }
        for (ExpressionCondition condition : conditions) {
            list.addAll(condition.fetchCellName());
        }
        return list;
    }
}
