package com.luck.report.web.domain.vo.cell;

import java.io.Serializable;

/**
 * 图表数据视图对象，用于返回给前端展示。
 * 仅包含前端渲染图表所需的字段，不包含 base64Data 等大数据字段。
 *
 * @author luckyPools
 * @since 2026年05月16日
 */
public class ChartDataVo implements Serializable {
    private static final long serialVersionUID = 1L;

    /**
     * 图表唯一标识，对应 canvas 元素的 ID
     */
    private String id;

    /**
     * 图表配置 JSON 字符串，包含 Chart.js 所需的完整配置
     */
    private String json;

    /**
     * 默认无参构造器。
     */
    public ChartDataVo() {
    }

    /**
     * 构造图表数据视图对象。
     *
     * @param id   图表唯一标识
     * @param json 图表配置 JSON 字符串
     */
    public ChartDataVo(String id, String json) {
        this.id = id;
        this.json = json;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getJson() {
        return json;
    }

    public void setJson(String json) {
        this.json = json;
    }
}
