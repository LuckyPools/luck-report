package com.luck.agent.modules.agentKnowledgeConfig.domain.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 分页结果VO
 * 用于封装分页查询的返回结果
 *
 * @param <T> 数据类型
 * @author luck
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PageResult<T> {

    /** 数据列表 */
    private List<T> data;

    /** 总记录数 */
    private Long total;

    /** 当前页码 */
    private Integer pageNum;

    /** 每页大小 */
    private Integer pageSize;

    /** 总页数 */
    private Integer totalPages;

    /**
     * 计算总页数
     */
    public void calculateTotalPages() {
        if (total != null && pageSize != null && pageSize > 0) {
            this.totalPages = (int) Math.ceil((double) total / pageSize);
        } else {
            this.totalPages = 0;
        }
    }
}
