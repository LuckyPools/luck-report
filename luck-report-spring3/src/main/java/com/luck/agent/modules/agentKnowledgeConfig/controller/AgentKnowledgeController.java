package com.luck.agent.modules.agentKnowledgeConfig.controller;

import com.luck.agent.modules.agentKnowledgeConfig.domain.dto.AgentKnowledgeQueryDTO;
import com.luck.agent.modules.agentKnowledgeConfig.domain.dto.CreateAgentKnowledgeDTO;
import com.luck.agent.modules.agentKnowledgeConfig.domain.dto.UpdateAgentKnowledgeDTO;
import com.luck.agent.modules.agentKnowledgeConfig.domain.vo.AgentKnowledgeVO;
import com.luck.agent.modules.agentKnowledgeConfig.domain.vo.PageResult;
import com.luck.agent.modules.agentKnowledgeConfig.service.AgentKnowledgeService;
import com.luck.agent.modules.businessKnowledgeConfig.domain.vo.ApiResponse;
import javax.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 智能体知识管理Controller
 * 提供智能体知识的增删改查和向量化管理接口
 *
 * @author luck
 */
@Slf4j
@RestController
@RequestMapping("/agent-knowledge")
@CrossOrigin(origins = "*")
@AllArgsConstructor
public class AgentKnowledgeController {

    private final AgentKnowledgeService agentKnowledgeService;

    /**
     * 根据ID查询智能体知识详情
     *
     * @param id 智能体知识ID
     * @return 智能体知识详情
     */
    @GetMapping("/detail/{id}")
    public ApiResponse<AgentKnowledgeVO> getKnowledgeById(@PathVariable("id") Long id) {
        AgentKnowledgeVO knowledge = agentKnowledgeService.getKnowledgeById(id);
        if (knowledge == null) {
            return ApiResponse.error("知识不存在");
        }
        return ApiResponse.success("查询成功", knowledge);
    }

    /**
     * 创建智能体知识，支持文件上传
     *
     * @param title 知识标题
     * @param type 知识类型（DOCUMENT/QA/FAQ）
     * @param question 问题（QA/FAQ类型时使用）
     * @param content 内容（QA/FAQ类型时使用）
     * @param file 上传的文件（DOCUMENT类型时使用）
     * @param splitterType 分块策略类型
     * @return 创建的智能体知识
     */
    @PostMapping(value = "/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<AgentKnowledgeVO> createKnowledge(
            @RequestPart("title") String title,
            @RequestPart("type") String type,
            @RequestPart(value = "question", required = false) String question,
            @RequestPart(value = "content", required = false) String content,
            @RequestPart(value = "file", required = false) MultipartFile file,
            @RequestPart(value = "splitterType", required = false) String splitterType,
            @RequestPart("modelId") Long modelId) {

        CreateAgentKnowledgeDTO dto = new CreateAgentKnowledgeDTO();
        dto.setTitle(title);
        dto.setType(type);
        dto.setQuestion(question);
        dto.setContent(content);
        dto.setFile(file);
        dto.setSplitterType(splitterType);
        dto.setModelId(modelId);

        AgentKnowledgeVO knowledge = agentKnowledgeService.createKnowledge(dto);
        return ApiResponse.success("创建知识成功，后台向量存储开始更新，请耐心等待...", knowledge);
    }

    /**
     * 更新智能体知识
     *
     * @param id 智能体知识ID
     * @param updateKnowledgeDTO 更新智能体知识DTO
     * @return 更新的智能体知识
     */
    @PutMapping("/update/{id}")
    public ApiResponse<AgentKnowledgeVO> updateKnowledge(@PathVariable("id") Long id,
                                                          @RequestBody UpdateAgentKnowledgeDTO updateKnowledgeDTO) {
        AgentKnowledgeVO knowledge = agentKnowledgeService.updateKnowledge(id, updateKnowledgeDTO);
        return ApiResponse.success("更新成功", knowledge);
    }

    /**
     * 更新生效状态
     *
     * @param id 智能体知识ID
     * @param enabled 是否生效
     * @return 更新的智能体知识
     */
    @PostMapping("/enable/{id}")
    public ApiResponse<AgentKnowledgeVO> updateEnabledStatus(@PathVariable("id") Long id,
                                                              @RequestParam(value = "enabled") Boolean enabled) {
        AgentKnowledgeVO knowledge = agentKnowledgeService.updateEnabledStatus(id, enabled);
        return ApiResponse.success("更新成功", knowledge);
    }

    /**
     * 删除智能体知识
     *
     * @param id 智能体知识ID
     * @return 删除结果
     */
    @DeleteMapping("/delete/{id}")
    public ApiResponse<Boolean> deleteKnowledge(@PathVariable("id") Long id) {
        boolean result = agentKnowledgeService.deleteKnowledge(id);
        return result ? ApiResponse.success("删除操作已接收，等待后台删除相关资源...") : ApiResponse.error("删除失败");
    }

    /**
     * 分页查询智能体知识列表
     *
     * @param queryDTO 查询条件
     * @return 分页结果
     */
    @PostMapping("/query/page")
    public ApiResponse<PageResult<AgentKnowledgeVO>> queryByPage(@Valid @RequestBody AgentKnowledgeQueryDTO queryDTO) {
        try {
            PageResult<AgentKnowledgeVO> pageResult = agentKnowledgeService.queryByPage(queryDTO);
            return ApiResponse.success("查询成功", pageResult);
        } catch (Exception e) {
            log.error("分页查询知识列表失败：{}", e.getMessage());
            return ApiResponse.error("分页查询失败：" + e.getMessage());
        }
    }

    /**
     * 重试向量化
     *
     * @param id 智能体知识ID
     * @return 重试结果
     */
    @PostMapping("/retry-embedding/{id}")
    public ApiResponse<Boolean> retryEmbedding(@PathVariable("id") Long id) {
        agentKnowledgeService.retryEmbedding(id);
        return ApiResponse.success("重试向量化操作成功，如果是文件解析需要花费点时间，请耐心等待...");
    }
}
