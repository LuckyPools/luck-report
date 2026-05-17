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
package com.luck.report.core.expression.model.data;

import com.luck.report.core.build.BindData;

import java.io.Serializable;
import java.util.List;

/**
 * @author Jacky.gao
 * @since 2017年4月28日
 */
public class BindDataListExpressionData implements ExpressionData<List<BindData>>, Serializable {
    private static final long serialVersionUID = 1L;
    private List<BindData> list;

    public BindDataListExpressionData() {}

    public BindDataListExpressionData(List<BindData> list) {
        this.list = list;
    }

    @Override
    public List<BindData> getData() {
        return list;
    }

    /**
     * 设置列表数据
     * @param list 列表数据
     */
    public void setData(List<BindData> list) {
        this.list = list;
    }
}
