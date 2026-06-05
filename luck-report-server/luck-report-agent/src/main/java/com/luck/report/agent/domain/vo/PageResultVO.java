package com.luck.report.agent.domain.vo;

import com.luck.report.agent.enums.HttpCodeEnum;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

/**
 * 分页结果封装类
 * 用于统一分页查询的返回格式，自带 code 和 message，无需再套 ResultVO
 *
 * @author luck
 * @param <T> 数据类型
 */
@Data
@NoArgsConstructor
public class PageResultVO<T> implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 响应码：0表示成功，非0表示失败
     */
    private int code = HttpCodeEnum.OK.getCode();

    /**
     * 响应消息
     */
    private String message;

    /**
     * 数据列表
     */
    private List<T> records;

    /**
     * 总记录数
     */
    private long total;

    /**
     * 当前页码
     */
    private int pageNum;

    /**
     * 每页数量
     */
    private int pageSize;

    /**
     * 构建成功分页响应
     *
     * @param records  数据列表
     * @param total    总记录数
     * @param pageNum  当前页码
     * @param pageSize 每页数量
     * @return PageResultVO
     */
    public static <T> PageResultVO<T> success(List<T> records, long total, int pageNum, int pageSize) {
        PageResultVO<T> result = new PageResultVO<>();
        result.setCode(HttpCodeEnum.OK.getCode());
        result.setMessage(HttpCodeEnum.OK.getMessage());
        result.setRecords(records);
        result.setTotal(total);
        result.setPageNum(pageNum);
        result.setPageSize(pageSize);
        return result;
    }

    /**
     * 构建失败分页响应
     *
     * @param message 错误消息
     * @return PageResultVO
     */
    public static <T> PageResultVO<T> error(String message) {
        PageResultVO<T> result = new PageResultVO<>();
        result.setCode(HttpCodeEnum.UN_KNOW_ERROR.getCode());
        result.setMessage(message);
        return result;
    }

    /**
     * 判断是否成功
     *
     * @return code == 0 时返回 true
     */
    public boolean isOk() {
        return this.code == HttpCodeEnum.OK.getCode();
    }
}
