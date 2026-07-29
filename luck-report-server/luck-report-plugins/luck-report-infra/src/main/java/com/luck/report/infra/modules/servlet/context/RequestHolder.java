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
package com.luck.report.infra.modules.servlet.context;

import com.luck.report.infra.modules.servlet.provider.RequestInfoProvider;

/**
 * @author Jacky.gao
 * @since 2017年3月8日
 */
public class RequestHolder {
    private static final ThreadLocal<RequestInfoProvider> requestThreadLocal = new ThreadLocal<RequestInfoProvider>();

    public static RequestInfoProvider getRequest() {
        return requestThreadLocal.get();
    }

    public static void setRequest(RequestInfoProvider request) {
        requestThreadLocal.set(request);
    }

    public static void clean() {
        requestThreadLocal.remove();
    }
}
