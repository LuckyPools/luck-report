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
package com.luck.report.core.expression.function;

import com.luck.report.core.build.Context;
import com.luck.report.core.expression.model.data.BindDataListExpressionData;
import com.luck.report.core.expression.model.data.ExpressionData;
import com.luck.report.core.expression.model.data.ObjectExpressionData;
import com.luck.report.core.expression.model.data.ObjectListExpressionData;
import com.luck.report.core.model.Cell;

import java.util.List;

/**
 * @author Jacky.gao
 * @since 2016年12月27日
 */
public class CountFunction implements Function {

    @Override
    public Object execute(List<ExpressionData<?>> dataList, Context context, Cell currentCell) {
        if (dataList == null || dataList.size() == 0) {
            return null;
        }
        int size = 0;
        for (ExpressionData<?> data : dataList) {
            if (data instanceof ObjectListExpressionData) {
                ObjectListExpressionData listExpressionData = (ObjectListExpressionData) data;
                size += listExpressionData.getData().size();
            } else if (data instanceof ObjectExpressionData) {
                size++;
            } else if (data instanceof BindDataListExpressionData) {
                BindDataListExpressionData bindDataList = (BindDataListExpressionData) data;
                size += bindDataList.getData().size();
            }
        }
        return size;
    }

    @Override
    public String name() {
        return "count";
    }
}
