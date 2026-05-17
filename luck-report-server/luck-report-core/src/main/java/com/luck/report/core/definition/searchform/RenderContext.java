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
package com.luck.report.core.definition.searchform;

import com.luck.report.core.build.Dataset;
import com.luck.report.core.definition.searchform.component.Component;

import java.io.Serializable;
import java.util.HashMap;
import java.util.Map;

/**
 * @author Jacky.gao
 * @since 2017年10月23日
 */
public class RenderContext implements Serializable {
    private static final long serialVersionUID = 1L;
    private int id = 0;
    private Map<String, Dataset> datasetMap;
    private Map<String, Object> parameters;
    private Map<Component, String> componentMap = new HashMap<Component, String>();
    private Map<String, Object> metadata = new HashMap<String, Object>();

    /**
     * 默认无参构造器
     */
    public RenderContext() {}

    public RenderContext(Map<String, Dataset> datasetMap, Map<String, Object> parameters) {
        this.datasetMap = datasetMap;
        this.parameters = parameters;
    }

    public Dataset getDataset(String datasetName) {
        return datasetMap.get(datasetName);
    }

    public Object getParameter(String name) {
        return parameters.get(name);
    }

    public String buildComponentId(Component component) {
        if (componentMap.containsKey(component)) {
            return componentMap.get(component);
        }
        String cid = "__c_" + (id++);
        componentMap.put(component, cid);
        return cid;
    }

    public Object getMetadata(String key) {
        return metadata.get(key);
    }

    public void putMetadata(String key, Object value) {
        metadata.put(key, value);
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public Map<String, Dataset> getDatasetMap() {
        return datasetMap;
    }

    public void setDatasetMap(Map<String, Dataset> datasetMap) {
        this.datasetMap = datasetMap;
    }

    public Map<String, Object> getParameters() {
        return parameters;
    }

    public void setParameters(Map<String, Object> parameters) {
        this.parameters = parameters;
    }

    public Map<Component, String> getComponentMap() {
        return componentMap;
    }

    public void setComponentMap(Map<Component, String> componentMap) {
        this.componentMap = componentMap;
    }

    /**
     * 获取完整元数据映射
     * @return 元数据映射
     */
    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }
}
