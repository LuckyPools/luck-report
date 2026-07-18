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
package com.luck.report.core.expression.model;

import com.luck.report.core.build.Context;
import com.luck.report.core.expression.model.data.ExpressionData;
import com.luck.report.core.model.Cell;

import java.io.Serializable;
import java.util.List;

/**
 * @author Jacky.gao
 * @since 2016年11月18日
 */
public interface Expression extends Serializable {
    ExpressionData<?> execute(Cell cell, Cell currentCell, Context context);

    /**
     * 从表达式中提取引用的单元格名称
     * @return 引用的单元格名称列表
     */
    List<String> fetchCellName();
}
