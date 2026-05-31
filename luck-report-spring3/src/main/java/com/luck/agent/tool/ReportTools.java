package com.luck.agent.tool;

import com.luck.agent.service.ChatSessionManager;
import dev.langchain4j.agent.tool.P;
import dev.langchain4j.agent.tool.Tool;
import lombok.extern.slf4j.Slf4j;

import java.util.HashMap;
import java.util.Map;

/**
 * 报表工具类
 * 提供单元格读写等操作，供 AI 模型调用
 * 工具会将指令发送给前端执行，并等待前端返回结果
 *
 * @author luck
 */
@Slf4j
public class ReportTools {

    private final ChatSessionManager sessionManager;

    /**
     * 构造函数
     *
     * @param sessionManager 会话管理服务，用于发送工具调用事件和等待前端结果
     */
    public ReportTools(ChatSessionManager sessionManager) {
        this.sessionManager = sessionManager;
    }

    /**
     * 读取单元格数据
     * 将指令发送给前端执行，等待前端返回结果
     *
     * @param explanation 工具调用解释
     * @param rowIndex    单元格行坐标，从0开始
     * @param colIndex    单元格列坐标，从0开始
     * @return 前端执行结果
     */
    @Tool("读取指定坐标的单元格数据。参数：行坐标和列坐标。")
    public String readCell(
            @P("关于为什么使用此工具以及它如何有助于目标的单句解释，不超过30字。") String explanation,
            @P("单元格行坐标，从0开始") Integer rowIndex,
            @P("单元格列坐标，从0开始") Integer colIndex) {
        log.info("调用工具 readCell, 行: {}, 列: {}, 原因: {}", rowIndex, colIndex, explanation);

        Map<String, Object> args = new HashMap<>();
        args.put("rowIndex", rowIndex);
        args.put("colIndex", colIndex);

        String callId = sessionManager.sendToolCallToFrontend("readCellByAgent", args);
        if (callId == null) {
            return "工具调用失败：无法发送指令给前端";
        }

        log.info("工具 readCell 等待前端执行结果: callId={}", callId);

        String result = sessionManager.waitForToolResult(callId);
        if (result != null) {
            log.info("工具 readCell 收到前端结果: {}", result);
            return result;
        }

        return "前端执行超时";
    }

    /**
     * 设置单元格数据
     * 将指令发送给前端执行，等待前端返回结果
     *
     * @param explanation 工具调用解释
     * @param rowIndex    单元格行坐标，从0开始
     * @param colIndex    单元格列坐标，从0开始
     * @param cellValue   要设置的单元格值
     * @return 前端执行结果
     */
    @Tool("设置指定坐标的单元格数据。参数：行坐标、列坐标、单元格值。")
    public String setCell(
            @P("关于为什么使用此工具以及它如何有助于目标的单句解释，不超过30字。") String explanation,
            @P("单元格行坐标，从0开始") Integer rowIndex,
            @P("单元格列坐标，从0开始") Integer colIndex,
            @P("要设置的单元格值") String cellValue) {
        log.info("调用工具 setCell, 行: {}, 列: {}, 值: {}, 原因: {}", rowIndex, colIndex, cellValue, explanation);

        Map<String, Object> args = new HashMap<>();
        args.put("rowIndex", rowIndex);
        args.put("colIndex", colIndex);
        args.put("cellValue", cellValue);

        String callId = sessionManager.sendToolCallToFrontend("setCellByAgent", args);
        if (callId == null) {
            return "工具调用失败：无法发送指令给前端";
        }

        log.info("工具 setCell 等待前端执行结果: callId={}", callId);

        String result = sessionManager.waitForToolResult(callId);
        if (result != null) {
            log.info("工具 setCell 收到前端结果: {}", result);
            return result;
        }

        return "前端执行超时";
    }
}
