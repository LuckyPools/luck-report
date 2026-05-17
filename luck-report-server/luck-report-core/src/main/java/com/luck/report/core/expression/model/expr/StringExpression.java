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
package com.luck.report.core.expression.model.expr;

import com.luck.report.core.build.Context;
import com.luck.report.core.expression.model.data.ExpressionData;
import com.luck.report.core.expression.model.data.ObjectExpressionData;
import com.luck.report.core.model.Cell;

/**
 * @author Jacky.gao
 * @since 2016年12月23日
 */
public class StringExpression extends BaseExpression {
    private static final long serialVersionUID = 1L;
    private String text;

    public StringExpression() {}

    public StringExpression(String text) {
        this.text = text;
    }

    @Override
    protected ExpressionData<?> compute(Cell cell, Cell currentCell, Context context) {
        return new ObjectExpressionData(text);
    }

    /**
     * 获取文本内容
     * @return 文本内容
     */
    public String getText() {
        return text;
    }

    /**
     * 设置文本内容
     * @param text 文本内容
     */
    public void setText(String text) {
        this.text = text;
    }
}
