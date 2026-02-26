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
package com.luck.report.web.filter;

import com.luck.report.web.utils.RequestHolder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import java.io.IOException;

/**
 * 请求持有过滤器，用于在请求处理过程中设置和清理RequestHolder
 *
 * @author Jacky.gao
 * @since 2017年3月8日
 */
@Component
public class RequestHolderFilter implements Filter {
    private static final Logger logger = LoggerFactory.getLogger(RequestHolderFilter.class);

    @Override
    public void init(FilterConfig filterConfig) {
        logger.info("RequestHolderFilter initialized");
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        String requestUri = httpRequest.getRequestURI();

        // 记录过滤器执行信息
        if (logger.isDebugEnabled()) {
            logger.debug("Setting request to RequestHolder for URI: {}", requestUri);
        }

        // 设置请求到RequestHolder
        RequestHolder.setRequest(httpRequest);
        try {
            // 继续过滤器链
            chain.doFilter(request, response);
        } finally {
            // 清理RequestHolder，避免内存泄漏
            if (logger.isDebugEnabled()) {
                logger.debug("Cleaning request from RequestHolder for URI: {}", requestUri);
            }
            RequestHolder.clean();
        }
    }

    @Override
    public void destroy() {
        logger.info("RequestHolderFilter destroyed");
    }
}
