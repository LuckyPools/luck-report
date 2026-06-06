package com.luck.report.agent.modules.vector.controller;

import com.luck.report.agent.modules.chat.domain.vo.ComponentDocAddRequest;
import com.luck.report.agent.domain.vo.ResultVO;
import com.luck.report.agent.modules.vector.domain.vo.VectorAddRequest;
import com.luck.report.agent.modules.vector.domain.vo.VectorSearchRequest;
import com.luck.report.agent.modules.vector.domain.vo.VectorSearchResult;
import com.luck.report.agent.modules.businessKnowledgeConfig.constant.DocumentMetadataConstant;
import com.luck.report.agent.modules.businessKnowledgeConfig.service.BusinessKnowledgeService;
import com.luck.report.agent.modules.agentKnowledgeConfig.constant.AgentKnowledgeMetadataConstant;
import com.luck.report.agent.modules.agentKnowledgeConfig.service.AgentKnowledgeService;
import com.luck.report.agent.modules.vector.service.impl.AgentVectorStore;
import com.luck.report.agent.modules.vector.domain.entity.VectorDocument;
import com.luck.report.agent.modules.vector.domain.dto.VectorStoreSearchResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 向量检索控制器
 * 前端 Agent 工具调用此接口获取相关知识
 * 提供向量检索和文档添加两个核心接口
 *
 * @author luck
 */
@RestController
@RequestMapping("${luck-report.servletPrefix:}/vector")
public class ReportVectorStoreController {

    private static final Logger log = LoggerFactory.getLogger(ReportVectorStoreController.class);

    @Autowired
    private AgentVectorStore reportAgentVectorStore;

    @Autowired
    private BusinessKnowledgeService businessKnowledgeService;

    @Autowired
    private AgentKnowledgeService agentKnowledgeService;

    /**
     * 向量检索接口
     * 前端 Agent 的 search_component_doc 等工具调用此接口
     * 先调用向量检索，再根据 vectorType 回填原文内容
     *
     * @param request 检索请求，包含查询文本、知识类型、topK、阈值、元数据过滤
     * @return 检索结果列表，按相似度降序，content已回填原文
     */
    @PostMapping("/search")
    public ResultVO<List<VectorSearchResult>> search(@RequestBody VectorSearchRequest request) {
        if (request.getQuery() == null || request.getQuery().isEmpty()) {
            return ResultVO.error(400, "查询文本不能为空");
        }
        if (request.getVectorType() == null || request.getVectorType().isEmpty()) {
            return ResultVO.error(400, "知识类型不能为空");
        }

        int topK = request.getTopK() != null ? request.getTopK() : 5;
        double threshold = request.getThreshold() != null ? request.getThreshold() : 0.5;

        // 1. 调用向量检索
        List<VectorStoreSearchResult> results = reportAgentVectorStore.search(
                request.getQuery(),
                request.getVectorType(),
                topK,
                threshold,
                request.getMetadataFilters()
        );

        // 2. 根据 vectorType 回填原文内容
        if (DocumentMetadataConstant.BUSINESS_TERM.equals(request.getVectorType())) {
            businessKnowledgeService.fillBusinessTermContent(results);
        } else if (AgentKnowledgeMetadataConstant.AGENT_KNOWLEDGE.equals(request.getVectorType())) {
            agentKnowledgeService.fillAgentKnowledgeContent(results);
        }

        // 3. 转换为 VO 返回
        List<VectorSearchResult> voList = results.stream()
                .map(r -> new VectorSearchResult(
                        r.getDocument().getId(),
                        r.getDocument().getContent(),
                        r.getScore(),
                        r.getDocument().getMetadata()
                ))
                .collect(Collectors.toList());

        return ResultVO.success(voList);
    }

    /**
     * 添加文档接口
     * 用于初始化组件文档、导入模板等场景
     *
     * @param request 文档添加请求
     * @return 是否添加成功
     */
    @PostMapping("/add")
    public ResultVO<Boolean> addDocument(@RequestBody VectorAddRequest request) {
        if (request.getContent() == null || request.getContent().isEmpty()) {
            return ResultVO.error(400, "文档内容不能为空");
        }
        if (request.getVectorType() == null || request.getVectorType().isEmpty()) {
            return ResultVO.error(400, "知识类型不能为空");
        }

        Map<String, Object> metadata = request.getMetadata() != null
                ? new HashMap<>(request.getMetadata())
                : new HashMap<>();
        metadata.put("vectorType", request.getVectorType());

        VectorDocument doc = new VectorDocument(request.getContent(), metadata);
        reportAgentVectorStore.addDocuments(Collections.singletonList(doc));

        return ResultVO.success(true);
    }

    /**
     * 批量添加文档接口
     * 用于初始化大量组件文档
     *
     * @param requests 文档添加请求列表
     * @return 是否添加成功
     */
    @PostMapping("/add-batch")
    public ResultVO<Boolean> addDocuments(@RequestBody List<VectorAddRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            return ResultVO.error(400, "文档列表不能为空");
        }

        List<VectorDocument> documents = new ArrayList<>();
        for (VectorAddRequest request : requests) {
            if (request.getContent() == null || request.getContent().isEmpty()
                    || request.getVectorType() == null || request.getVectorType().isEmpty()) {
                continue;
            }
            Map<String, Object> metadata = request.getMetadata() != null
                    ? new HashMap<>(request.getMetadata())
                    : new HashMap<>();
            metadata.put("vectorType", request.getVectorType());

            documents.add(new VectorDocument(request.getContent(), metadata));
        }

        if (!documents.isEmpty()) {
            reportAgentVectorStore.addDocuments(documents);
        }

        return ResultVO.success(true);
    }

    /**
     * 按知识类型删除文档
     *
     * @param vectorType 知识类型
     * @return 是否删除成功
     */
    @DeleteMapping("/delete/{vectorType}")
    public ResultVO<Boolean> deleteByVectorType(@PathVariable String vectorType) {
        boolean result = reportAgentVectorStore.deleteByVectorType(vectorType);
        return ResultVO.success(result);
    }

    /**
     * 添加组件文档接口
     * 将报表组件（图表、单元格、样式等）的结构化信息添加到向量库
     * 内部调用 ReportAgentVectorStore.addComponentDoc() 自动构建 content 和 metadata
     *
     * @param request 组件文档添加请求，包含组件名称、描述、类型、额外元数据
     * @return 是否添加成功
     */
    @PostMapping("/add-component-doc")
    public ResultVO<Boolean> addComponentDoc(@RequestBody ComponentDocAddRequest request) {
        if (request.getName() == null || request.getName().isEmpty()) {
            return ResultVO.error(400, "组件名称不能为空");
        }
        if (request.getDescription() == null || request.getDescription().isEmpty()) {
            return ResultVO.error(400, "组件描述不能为空");
        }
        if (request.getComponentType() == null || request.getComponentType().isEmpty()) {
            return ResultVO.error(400, "组件类型不能为空");
        }

        reportAgentVectorStore.addComponentDoc(
                request.getName(),
                request.getDescription(),
                request.getComponentType(),
                request.getExtraMetadata()
        );

        return ResultVO.success(true);
    }
}
