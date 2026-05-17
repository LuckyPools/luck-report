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

import java.io.Serializable;

/**
 * @author Jacky.gao
 * @since 2017年1月1日
 */
public class ObjectExpressionData implements ExpressionData<Object>, Serializable {
    private static final long serialVersionUID = 1L;
    private Object data;

    public ObjectExpressionData() {}

    public ObjectExpressionData(Object data) {
        this.data = data;
    }

    @Override
    public Object getData() {
        return data;
    }

    /**
     * 设置数据对象
     * @param data 数据对象
     */
    public void setData(Object data) {
        this.data = data;
    }
}
