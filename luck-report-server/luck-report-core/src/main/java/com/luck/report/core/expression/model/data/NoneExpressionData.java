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
 * @since 2017年5月5日
 */
public class NoneExpressionData implements ExpressionData<Object>, Serializable {
    private static final long serialVersionUID = 1L;

    public NoneExpressionData() {}

    @Override
    public Object getData() {
        return null;
    }

    /**
     * 空实现，用于兼容JSON反序列化时可能存在的data字段
     * @param data 数据对象（忽略）
     */
    public void setData(Object data) {
        // 空实现，忽略data字段
    }
}
