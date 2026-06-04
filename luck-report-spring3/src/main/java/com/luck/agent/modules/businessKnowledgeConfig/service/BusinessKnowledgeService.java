package com.luck.agent.modules.businessKnowledgeConfig.service;

import com.luck.agent.modules.vector.domain.dto.VectorStoreSearchResult;
import com.luck.agent.modules.businessKnowledgeConfig.domain.dto.CreateBusinessKnowledgeDTO;
import com.luck.agent.modules.businessKnowledgeConfig.domain.dto.UpdateBusinessKnowledgeDTO;
import com.luck.agent.modules.businessKnowledgeConfig.domain.entity.BusinessKnowledge;
import com.luck.agent.modules.businessKnowledgeConfig.domain.vo.BusinessKnowledgeVO;

import java.util.List;

/**
 * 业务知识服务接口
 * 提供业务知识的增删改查和向量化管理功能
 *
 * @author luck
 */
public interface BusinessKnowledgeService {

    /**
     * 获取业务知识列表
     *
     * @return 业务知识VO列表
     */
    List<BusinessKnowledgeVO> getKnowledge();

    /**
     * 搜索业务知识
     *
     * @param keyword 搜索关键词
     * @return 业务知识VO列表
     */
    List<BusinessKnowledgeVO> searchKnowledge(String keyword);

    /**
     * 根据ID获取业务知识详情
     *
     * @param id 业务知识ID
     * @return 业务知识VO
     */
    BusinessKnowledgeVO getKnowledgeById(Long id);

    /**
     * 添加业务知识
     *
     * @param knowledgeDTO 创建业务知识DTO
     * @return 业务知识VO
     */
    BusinessKnowledgeVO addKnowledge(CreateBusinessKnowledgeDTO knowledgeDTO);

    /**
     * 更新业务知识
     *
     * @param id 业务知识ID
     * @param knowledgeDTO 更新业务知识DTO
     * @return 业务知识VO
     */
    BusinessKnowledgeVO updateKnowledge(Long id, UpdateBusinessKnowledgeDTO knowledgeDTO);

    /**
     * 删除业务知识
     *
     * @param id 业务知识ID
     */
    void deleteKnowledge(Long id);

    /**
     * 设置业务知识的召回状态
     *
     * @param id 业务知识ID
     * @param isRecall 是否召回
     */
    void recallKnowledge(Long id, Boolean isRecall);

    /**
     * 刷新所有业务知识到向量存储
     *
     * @throws Exception 刷新异常
     */
    void refreshAllKnowledgeToVectorStore() throws Exception;

    /**
     * 重试向量化
     *
     * @param id 业务知识ID
     */
    void retryEmbedding(Long id);

    /**
     * 根据ID列表批量查询业务知识实体
     * 用于向量检索结果回填原文内容
     *
     * @param ids 业务知识ID列表
     * @return 业务知识实体列表
     */
    List<BusinessKnowledge> selectByIds(List<Long> ids);

    /**
     * 回填业务知识原文内容
     * 根据 metadata 中的 businessTermId 从 MySQL 批量查询，构建完整 content
     *
     * @param results 向量检索结果列表
     */
    void fillBusinessTermContent(List<VectorStoreSearchResult> results);
}
