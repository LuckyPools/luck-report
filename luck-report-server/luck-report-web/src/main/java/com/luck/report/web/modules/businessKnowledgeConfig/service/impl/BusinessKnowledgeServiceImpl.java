package com.luck.report.web.modules.businessKnowledgeConfig.service.impl;

import com.luck.report.web.utils.SnowflakeIdGenerator;
import com.luck.report.web.common.vo.PageResultVO;
import com.luck.report.web.modules.businessKnowledgeConfig.domain.dto.BusinessKnowledgeQueryDTO;
import com.luck.report.infra.modules.vector.domain.dto.VectorStoreSearchResult;
import com.luck.report.infra.modules.vector.domain.entity.VectorDocument;
import com.luck.report.web.modules.businessKnowledgeConfig.constant.DocumentMetadataConstant;
import com.luck.report.web.modules.businessKnowledgeConfig.converter.BusinessKnowledgeConverter;
import com.luck.report.web.modules.businessKnowledgeConfig.domain.dto.CreateBusinessKnowledgeDTO;
import com.luck.report.web.modules.businessKnowledgeConfig.domain.dto.UpdateBusinessKnowledgeDTO;
import com.luck.report.web.modules.businessKnowledgeConfig.domain.entity.BusinessKnowledge;
import com.luck.report.web.modules.businessKnowledgeConfig.domain.enums.EmbeddingStatus;
import com.luck.report.web.modules.businessKnowledgeConfig.mapper.BusinessKnowledgeMapper;
import com.luck.report.web.modules.businessKnowledgeConfig.service.BusinessKnowledgeService;
import com.luck.report.web.modules.businessKnowledgeConfig.utils.DocumentConverterUtil;
import com.luck.report.web.modules.businessKnowledgeConfig.domain.vo.BusinessKnowledgeVO;
import com.luck.report.infra.modules.vector.service.impl.AgentVectorStore;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.util.CollectionUtils;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 业务知识服务实现类
 * 提供业务知识的增删改查和向量化管理功能
 *
 * @author luck
 */
@Slf4j
@Service("bean.businessKnowledgeService")
@AllArgsConstructor
public class BusinessKnowledgeServiceImpl implements BusinessKnowledgeService {

    private final BusinessKnowledgeMapper businessKnowledgeMapper;
    private final AgentVectorStore reportAgentVectorStore;
    private final BusinessKnowledgeConverter businessKnowledgeConverter;
    private final TransactionTemplate transactionTemplate;

    /**
     * 获取业务知识列表
     *
     * @return 业务知识VO列表
     */
    @Override
    public List<BusinessKnowledgeVO> getKnowledge() {
        List<BusinessKnowledge> businessKnowledges = businessKnowledgeMapper.selectAll();
        if (CollectionUtils.isEmpty(businessKnowledges)) {
            return Collections.emptyList();
        }
        return businessKnowledges.stream().map(businessKnowledgeConverter::toVo).collect(Collectors.toList());
    }

    /**
     * 搜索业务知识
     *
     * @param keyword 搜索关键词
     * @return 业务知识VO列表
     */
    @Override
    public List<BusinessKnowledgeVO> searchKnowledge(String keyword) {
        List<BusinessKnowledge> businessKnowledges = businessKnowledgeMapper.search(keyword);
        if (CollectionUtils.isEmpty(businessKnowledges)) {
            return Collections.emptyList();
        }
        return businessKnowledges.stream().map(businessKnowledgeConverter::toVo).collect(Collectors.toList());
    }

    /**
     * 根据ID获取业务知识详情
     *
     * @param id 业务知识ID
     * @return 业务知识VO
     */
    @Override
    public BusinessKnowledgeVO getKnowledgeById(String id) {
        BusinessKnowledge businessKnowledge = businessKnowledgeMapper.selectById(id);
        if (businessKnowledge == null) {
            return null;
        }
        return businessKnowledgeConverter.toVo(businessKnowledge);
    }

    /**
     * 添加业务知识
     * 先在事务内插入MySQL，事务提交后再同步到向量存储
     * 使用编程式事务确保向量操作在事务外执行，避免 @Transactional 提前绑定MySQL连接导致数据源切换失效
     *
     * @param knowledgeDTO 创建业务知识DTO
     * @return 业务知识VO
     */
    @Override
    public BusinessKnowledgeVO addKnowledge(CreateBusinessKnowledgeDTO knowledgeDTO) {
        BusinessKnowledge entity = businessKnowledgeConverter.toEntityForCreate(knowledgeDTO);
        // 由 Java 端生成 Snowflake ID（不再依赖数据库自增）
        entity.setId(SnowflakeIdGenerator.generateId());

        // MySQL操作放在编程式事务内，事务提交后释放连接
        transactionTemplate.executeWithoutResult(status -> {
            if (businessKnowledgeMapper.insert(entity) <= 0) {
                throw new RuntimeException("添加业务知识到数据库失败");
            }
        });

        // 向量操作在事务外执行，使用 plugin 自治的 vector 数据源
        try {
            VectorDocument document = DocumentConverterUtil.convertBusinessKnowledgeToDocument(entity);
            reportAgentVectorStore.addDocuments(Collections.singletonList(document), entity.getModelId());
            entity.setEmbeddingStatus(EmbeddingStatus.COMPLETED);
            entity.setErrorMsg(null);
            businessKnowledgeMapper.updateById(entity);
        } catch (Exception e) {
            String errorMsg = truncateErrorMsg("添加到向量存储失败: " + e.getMessage());
            entity.setEmbeddingStatus(EmbeddingStatus.FAILED);
            entity.setErrorMsg(errorMsg);
            businessKnowledgeMapper.updateById(entity);
            log.error("添加业务知识到向量存储失败, id: {}, error: {}", entity.getId(), errorMsg);
        }
        return businessKnowledgeConverter.toVo(entity);
    }

    /**
     * 更新业务知识
     * 先在事务内更新MySQL，事务提交后再同步到向量存储
     * 使用编程式事务确保向量操作在事务外执行，避免 @Transactional 提前绑定MySQL连接导致数据源切换失效
     *
     * @param id 业务知识ID
     * @param knowledgeDTO 更新业务知识DTO
     * @return 业务知识VO
     */
    @Override
    public BusinessKnowledgeVO updateKnowledge(String id, UpdateBusinessKnowledgeDTO knowledgeDTO) {
        // 从数据库获取原始数据
        BusinessKnowledge knowledge = businessKnowledgeMapper.selectById(id);
        if (knowledge == null) {
            throw new RuntimeException("业务知识不存在, id: " + id);
        }

        // 更新属性
        businessKnowledgeConverter.applyUpdateToEntity(knowledge, knowledgeDTO);
        knowledge.setEmbeddingStatus(EmbeddingStatus.PROCESSING);

        // MySQL操作放在编程式事务内，事务提交后释放连接
        transactionTemplate.executeWithoutResult(status -> {
            if (businessKnowledgeMapper.updateById(knowledge) <= 0) {
                throw new RuntimeException("更新业务知识到数据库失败");
            }
        });

        // 向量操作在事务外执行，使用 plugin 自治的 vector 数据源
        try {
            syncToVectorStore(knowledge);
            knowledge.setEmbeddingStatus(EmbeddingStatus.COMPLETED);
            knowledge.setErrorMsg(null);
            businessKnowledgeMapper.updateById(knowledge);
        } catch (Exception e) {
            // 向量库更新失败，不回滚MySQL，只标记状态为失败
            String errorMsg = truncateErrorMsg("更新向量存储失败: " + e.getMessage());
            knowledge.setEmbeddingStatus(EmbeddingStatus.FAILED);
            knowledge.setErrorMsg(errorMsg);
            businessKnowledgeMapper.updateById(knowledge);
            log.error("更新向量存储失败, id: {}, error: {}", id, errorMsg);
        }
        return businessKnowledgeConverter.toVo(knowledge);
    }

    /**
     * 更新向量库中的知识向量
     *
     * @param knowledge 业务知识实体
     */
    private void syncToVectorStore(BusinessKnowledge knowledge) {
        // 先删除旧的向量数据
        doDelVector(knowledge);

        // 添加新的向量数据
        VectorDocument newDocument = DocumentConverterUtil.convertBusinessKnowledgeToDocument(knowledge);
        reportAgentVectorStore.addDocuments(Collections.singletonList(newDocument), knowledge.getModelId());

        log.info("成功更新向量存储, id: {}", knowledge.getId());
    }

    /**
     * 删除业务知识
     * 先在事务外删除向量数据，再在事务内逻辑删除MySQL数据
     * 使用编程式事务确保向量操作在事务外执行，避免 @Transactional 提前绑定MySQL连接导致数据源切换失效
     *
     * @param id 业务知识ID
     */
    @Override
    public void deleteKnowledge(String id) {
        // 从数据库获取原始数据
        BusinessKnowledge knowledge = businessKnowledgeMapper.selectById(id);
        if (knowledge == null) {
            log.warn("业务知识不存在, id: {}", id);
            return;
        }

        // 向量操作在事务外执行，使用 plugin 自治的 vector 数据源
        doDelVector(knowledge);

        // MySQL操作放在编程式事务内
        transactionTemplate.executeWithoutResult(status -> {
            if (businessKnowledgeMapper.logicalDelete(id, 1, java.time.LocalDateTime.now()) <= 0) {
                throw new RuntimeException("逻辑删除业务知识失败");
            }
        });
    }

    /**
     * 删除向量数据
     *
     * @param knowledge 业务知识实体
     */
    private void doDelVector(BusinessKnowledge knowledge) {
        // 调用新的组合删除接口：按 vectorType + metadata 字段删除
        reportAgentVectorStore.deleteByMetadata(
            DocumentMetadataConstant.BUSINESS_TERM,
            DocumentMetadataConstant.DB_BUSINESS_TERM_ID,
            knowledge.getId()
        );
    }

    /**
     * 设置业务知识的生效状态
     * 仅更新MySQL，不更新向量库
     *
     * @param id 业务知识ID
     * @param enabled 是否生效
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void recallKnowledge(String id, Boolean enabled) {
        // 从数据库获取原始数据
        BusinessKnowledge knowledge = businessKnowledgeMapper.selectById(id);
        if (knowledge == null) {
            throw new RuntimeException("业务知识不存在, id: " + id);
        }

        // 更新数据库即可，不需要更新向量库
        knowledge.setEnabled(enabled ? 1 : 0);
        businessKnowledgeMapper.updateById(knowledge);
    }

    /**
     * 刷新所有业务知识到向量存储
     * 先删除向量库中的业务知识，再重新添加所有召回的业务知识
     *
     * @throws Exception 刷新异常
     */
    @Override
    public void refreshAllKnowledgeToVectorStore() throws Exception {
        // 删除向量库中的业务知识：调用新的类型删除接口
        reportAgentVectorStore.deleteByVectorType(DocumentMetadataConstant.BUSINESS_TERM);

        // 获取所有生效的业务知识
        List<BusinessKnowledge> allKnowledge = businessKnowledgeMapper.selectAll();
        List<BusinessKnowledge> enabledKnowledge = allKnowledge.stream()
                .filter(knowledge -> knowledge.getEnabled() != null && knowledge.getEnabled() == 1)
                .filter(knowledge -> knowledge.getIsDeleted() == null || knowledge.getIsDeleted() == 0)
                .collect(Collectors.toList());

        // 转换为向量文档并插入到向量存储，每条知识使用各自的modelId
        if (!enabledKnowledge.isEmpty()) {
            for (BusinessKnowledge knowledge : enabledKnowledge) {
                VectorDocument document = DocumentConverterUtil.convertBusinessKnowledgeToDocument(knowledge);
                reportAgentVectorStore.addDocuments(Collections.singletonList(document), knowledge.getModelId());
            }
        }
    }

    /**
     * 重试向量化
     * 对失败的业务知识重新进行向量化
     *
     * @param id 业务知识ID
     */
    @Override
    public void retryEmbedding(String id) {
        BusinessKnowledge knowledge = businessKnowledgeMapper.selectById(id);
        if (knowledge == null) {
            throw new RuntimeException("业务知识不存在, id: " + id);
        }

        if (knowledge.getEmbeddingStatus().equals(EmbeddingStatus.PROCESSING)) {
            throw new RuntimeException("业务知识正在处理中，请等待");
        }

        // 未生效的不处理
        if (knowledge.getEnabled() == null || knowledge.getEnabled() == 0) {
            throw new RuntimeException("业务知识未生效，请先设为生效");
        }

        try {
            syncToVectorStore(knowledge);
            knowledge.setEmbeddingStatus(EmbeddingStatus.COMPLETED);
            knowledge.setErrorMsg(null);
            businessKnowledgeMapper.updateById(knowledge);
        } catch (Exception e) {
            // 再次失败，更新错误信息
            String errorMsg = truncateErrorMsg(e.getMessage());
            knowledge.setEmbeddingStatus(EmbeddingStatus.FAILED);
            knowledge.setErrorMsg(errorMsg);
            businessKnowledgeMapper.updateById(knowledge);
            throw new RuntimeException("重试失败: " + errorMsg);
        }
    }

    /**
     * 截断错误信息，确保不超过数据库字段长度
     *
     * @param errorMsg 原始错误信息
     * @return 截断后的错误信息，最大长度为 500 字符
     */
    private String truncateErrorMsg(String errorMsg) {
        if (errorMsg == null) {
            return null;
        }
        // 数据库字段长度为 500，保留一定余量
        return errorMsg.length() > 490 ? errorMsg.substring(0, 490) : errorMsg;
    }

    /**
     * 根据ID列表批量查询业务知识实体
     * 用于向量检索结果回填原文内容
     *
     * @param ids 业务知识ID列表
     * @return 业务知识实体列表
     */
    @Override
    public List<BusinessKnowledge> selectByIds(List<String> ids) {
        if (ids == null || ids.isEmpty()) {
            return Collections.emptyList();
        }
        return businessKnowledgeMapper.selectByIds(ids);
    }

    /**
     * 查询所有生效的业务知识ID列表
     * 用于向量检索时动态过滤，只召回 enabled=1 的知识
     *
     * @return 生效的业务知识ID列表
     */
    @Override
    public List<String> selectEnabledKnowledgeIds() {
        return businessKnowledgeMapper.selectEnabledKnowledgeIds();
    }

    /**
     * 回填业务知识原文内容
     * 根据 metadata 中的 businessTermId 从 MySQL 批量查询，构建完整 content
     *
     * @param results 向量检索结果列表
     */
    @Override
    public void fillBusinessTermContent(List<VectorStoreSearchResult> results) {
        if (results == null || results.isEmpty()) {
            return;
        }

        // 收集所有业务知识 ID（统一转为 String）
        List<String> ids = results.stream()
                .map(r -> r.getDocument().getMetadata())
                .filter(m -> m != null && m.containsKey(DocumentMetadataConstant.DB_BUSINESS_TERM_ID))
                .map(m -> String.valueOf(m.get(DocumentMetadataConstant.DB_BUSINESS_TERM_ID)))
                .filter(id -> id != null && !id.isEmpty())
                .distinct()
                .collect(Collectors.toList());

        if (ids.isEmpty()) {
            return;
        }

        // 批量查询 MySQL
        List<BusinessKnowledge> knowledgeList = selectByIds(ids);
        if (knowledgeList == null || knowledgeList.isEmpty()) {
            return;
        }

        // 构建 ID 到业务知识的映射
        Map<String, BusinessKnowledge> knowledgeMap = knowledgeList.stream()
                .collect(Collectors.toMap(BusinessKnowledge::getId, k -> k));

        // 回填 content
        for (VectorStoreSearchResult result : results) {
            Map<String, Object> metadata = result.getDocument().getMetadata();
            if (metadata == null || !metadata.containsKey(DocumentMetadataConstant.DB_BUSINESS_TERM_ID)) {
                continue;
            }
            String id = String.valueOf(metadata.get(DocumentMetadataConstant.DB_BUSINESS_TERM_ID));
            if (id.isEmpty()) {
                continue;
            }
            BusinessKnowledge knowledge = knowledgeMap.get(id);
            if (knowledge != null) {
                String content = DocumentConverterUtil.convertBusinessKnowledgeToDocument(knowledge).getContent();
                result.getDocument().setContent(content);
            }
        }
    }

    /**
     * 分页条件查询业务知识
     *
     * @param queryDTO 查询条件
     * @return 分页结果
     */
    @Override
    public PageResultVO<BusinessKnowledgeVO> queryByPage(BusinessKnowledgeQueryDTO queryDTO) {
        int offset = (queryDTO.getPageNum() - 1) * queryDTO.getPageSize();

        Long total = businessKnowledgeMapper.countByConditions(queryDTO);

        List<BusinessKnowledge> dataList = businessKnowledgeMapper.selectByConditionsWithPage(queryDTO, offset, queryDTO.getPageSize());
        List<BusinessKnowledgeVO> dataListVO = dataList.stream()
                .map(businessKnowledgeConverter::toVo)
                .collect(Collectors.toList());

        return PageResultVO.success(dataListVO, total, queryDTO.getPageNum(), queryDTO.getPageSize());
    }
}
