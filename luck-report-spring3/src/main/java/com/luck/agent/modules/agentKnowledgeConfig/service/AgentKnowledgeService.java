package com.luck.agent.modules.agentKnowledgeConfig.service;

import com.luck.agent.modules.agentKnowledgeConfig.domain.dto.AgentKnowledgeQueryDTO;
import com.luck.agent.modules.agentKnowledgeConfig.domain.dto.CreateAgentKnowledgeDTO;
import com.luck.agent.modules.agentKnowledgeConfig.domain.dto.UpdateAgentKnowledgeDTO;
import com.luck.agent.modules.agentKnowledgeConfig.domain.entity.AgentKnowledge;
import com.luck.agent.modules.agentKnowledgeConfig.domain.vo.AgentKnowledgeVO;
import com.luck.agent.modules.agentKnowledgeConfig.domain.vo.PageResult;
import com.luck.agent.modules.vector.domain.dto.VectorStoreSearchResult;

import java.util.List;

/**
 * 智能体知识服务接口
 * 提供智能体知识的增删改查和向量化管理功能
 *
 * @author luck
 */
public interface AgentKnowledgeService {

    /**
     * 根据ID查询智能体知识详情
     *
     * @param id 智能体知识ID
     * @return 智能体知识VO
     */
    AgentKnowledgeVO getKnowledgeById(Long id);

    /**
     * 创建智能体知识
     *
     * @param createKnowledgeDTO 创建智能体知识DTO
     * @return 智能体知识VO
     */
    AgentKnowledgeVO createKnowledge(CreateAgentKnowledgeDTO createKnowledgeDTO);

    /**
     * 更新智能体知识
     *
     * @param id 智能体知识ID
     * @param updateKnowledgeDTO 更新智能体知识DTO
     * @return 智能体知识VO
     */
    AgentKnowledgeVO updateKnowledge(Long id, UpdateAgentKnowledgeDTO updateKnowledgeDTO);

    /**
     * 删除智能体知识
     *
     * @param id 智能体知识ID
     * @return 是否删除成功
     */
    boolean deleteKnowledge(Long id);

    /**
     * 分页条件查询智能体知识
     *
     * @param queryDTO 查询条件
     * @return 分页结果
     */
    PageResult<AgentKnowledgeVO> queryByPage(AgentKnowledgeQueryDTO queryDTO);

    /**
     * 更新智能体知识的生效状态
     *
     * @param id 智能体知识ID
     * @param enabled 是否生效
     * @return 智能体知识VO
     */
    AgentKnowledgeVO updateEnabledStatus(Long id, Boolean enabled);

    /**
     * 重试向量化
     *
     * @param id 智能体知识ID
     */
    void retryEmbedding(Long id);

    /**
     * 根据ID列表批量查询智能体知识实体
     * 用于向量检索结果回填原文内容
     *
     * @param ids 智能体知识ID列表
     * @return 智能体知识实体列表
     */
    List<AgentKnowledge> selectByIds(List<Long> ids);

    /**
     * 回填智能体知识原文内容
     * 根据 metadata 中的 agentKnowledgeId 从 MySQL 批量查询，构建完整 content
     *
     * @param results 向量检索结果列表
     */
    void fillAgentKnowledgeContent(List<VectorStoreSearchResult> results);
}
