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
package com.luck.report.web.utils;

import com.luck.report.web.exception.ReportDesignException;

import javax.servlet.http.HttpServletRequest;
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;

/**
 * url参数解析
 *
 * @author luckyPools
 * @date 2026-05-21
 */
public class UrlParameterUtils {
    public static String doubleDecode(String str) {
        if (str == null) {
            return str;
        }
        try {
            str = URLDecoder.decode(str, "utf-8");
            str = URLDecoder.decode(str, "utf-8");
            return str;
        } catch (UnsupportedEncodingException e) {
            throw new ReportDesignException(e);
        }
    }

    public static Map<String, Object> buildParameters(HttpServletRequest req) {
        Map<String, Object> parameters = new HashMap<String, Object>();
        Enumeration<?> enumeration = req.getParameterNames();
        while (enumeration.hasMoreElements()) {
            Object obj = enumeration.nextElement();
            if (obj == null) {
                continue;
            }
            String name = obj.toString();
            String value = req.getParameter(name);
            if (name == null || value == null || name.startsWith("_")) {
                continue;
            }
            parameters.put(name, UrlParameterUtils.doubleDecode(value));
        }
        return parameters;
    }
}
