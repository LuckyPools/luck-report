package com.luck.report.core.definition.dataset;

import com.luck.report.core.utils.JsonUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * @author jack
 * @version 1.0
 * @description: json数据集定义实现类
 * @date 2026-08-07 10:26
 */
public class JsonDatasetDefinition implements DatasetDefinition {
    private static final long serialVersionUID = 4581019308843195488L;

    private String name;
    /**
     * json内容
     */
    private String content;

    @Override
    public String getName() {
        return name;
    }

    @Override
    public List<Field> getFields() {
        List<Field> list = new ArrayList<>();
        List<Map<String, String>> maps = JsonUtils.extractArrayKeys(content);
        for (Map<String, String> map : maps) list.add(new Field(map.get("name")));
        return list;
    }


    public void setName(String name) {
        this.name = name;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}
