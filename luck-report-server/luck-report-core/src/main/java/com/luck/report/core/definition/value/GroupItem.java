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
package com.luck.report.core.definition.value;

import com.luck.report.core.expression.model.Condition;
import com.luck.report.core.expression.model.condition.BaseCondition;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.io.Serializable;
import java.util.List;

/**
 * @author Jacky.gao
 * @since 2017年3月28日
 */
public class GroupItem implements Serializable {
    private static final long serialVersionUID = 1L;
    private String name;
    @JsonIgnore // 内部重构 conditions
    private Condition condition;
    /**
     * 此属性给设计器使用，引擎不使用该属性
     */
    private List<Condition> conditions;

    /**
     * 默认无参构造器
     */
    public GroupItem() {}

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Condition getCondition() {
        return condition;
    }

    public void setCondition(Condition condition) {
        this.condition = condition;
    }

    public List<Condition> getConditions() {
        return conditions;
    }

    /**
     * 设置条件列表，同时自动构建条件链表
     * @param conditions 条件列表
     */
    public void setConditions(List<Condition> conditions) {
        this.conditions = conditions;
        if (conditions != null && !conditions.isEmpty()) {
            BaseCondition topCondition = null;
            BaseCondition prevCondition = null;
            for (Condition cond : conditions) {
                if (!(cond instanceof BaseCondition)) {
                    continue;
                }
                BaseCondition baseCond = (BaseCondition) cond;
                if (topCondition == null) {
                    topCondition = baseCond;
                    prevCondition = baseCond;
                } else {
                    prevCondition.setNextCondition(baseCond);
                    prevCondition = baseCond;
                }
            }
            this.condition = topCondition;
        }
    }
}
