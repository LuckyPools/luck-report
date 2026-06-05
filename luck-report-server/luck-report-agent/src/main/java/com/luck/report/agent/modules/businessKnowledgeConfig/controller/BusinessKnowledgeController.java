package com.luck.report.agent.modules.businessKnowledgeConfig.controller;

import com.luck.report.agent.modules.businessKnowledgeConfig.domain.dto.CreateBusinessKnowledgeDTO;
import com.luck.report.agent.modules.businessKnowledgeConfig.domain.dto.UpdateBusinessKnowledgeDTO;
import com.luck.report.agent.modules.businessKnowledgeConfig.service.BusinessKnowledgeService;
import com.luck.report.agent.modules.businessKnowledgeConfig.domain.vo.ApiResponse;
import com.luck.report.agent.modules.businessKnowledgeConfig.domain.vo.BusinessKnowledgeVO;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.StringUtils;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 业务知识管理Controller
 * 提供业务知识的增删改查和向量化管理接口
 *
 * @author luck
 */
@Slf4j
@RestController
@RequestMapping("/business-knowledge")
@CrossOrigin(origins = "*")
@AllArgsConstructor
public class BusinessKnowledgeController {

    private final BusinessKnowledgeService businessKnowledgeService;

    /**
     * 查询业务知识列表
     *
     * @param keyword 搜索关键词（可选）
     * @return 业务知识列表
     */
    @GetMapping("/list")
    public ApiResponse<List<BusinessKnowledgeVO>> list(@RequestParam(value = "keyword", required = false) String keyword) {
        List<BusinessKnowledgeVO> result;

        if (StringUtils.hasText(keyword)) {
            result = businessKnowledgeService.searchKnowledge(keyword);
        } else {
            result = businessKnowledgeService.getKnowledge();
        }
        return ApiResponse.success("查询业务知识列表成功", result);
    }

    /**
     * 根据ID查询业务知识详情
     *
     * @param id 业务知识ID
     * @return 业务知识详情
     */
    @GetMapping("/detail/{id}")
    public ApiResponse<BusinessKnowledgeVO> get(@PathVariable(value = "id") Long id) {
        BusinessKnowledgeVO vo = businessKnowledgeService.getKnowledgeById(id);
        if (vo == null) {
            return ApiResponse.error("业务知识不存在");
        }
        return ApiResponse.success("查询业务知识详情成功", vo);
    }

    /**
     * 创建业务知识
     *
     * @param knowledge 创建业务知识DTO
     * @return 创建的业务知识
     */
    @PostMapping("/create")
    public ApiResponse<BusinessKnowledgeVO> create(@RequestBody @Validated CreateBusinessKnowledgeDTO knowledge) {
        return ApiResponse.success("创建业务知识成功", businessKnowledgeService.addKnowledge(knowledge));
    }

    /**
     * 更新业务知识
     *
     * @param id 业务知识ID
     * @param knowledge 更新业务知识DTO
     * @return 更新的业务知识
     */
    @PutMapping("/update/{id}")
    public ApiResponse<BusinessKnowledgeVO> update(@PathVariable(value = "id") Long id,
                                                    @RequestBody @Validated UpdateBusinessKnowledgeDTO knowledge) {
        return ApiResponse.success("更新业务知识成功", businessKnowledgeService.updateKnowledge(id, knowledge));
    }

    /**
     * 删除业务知识
     *
     * @param id 业务知识ID
     * @return 删除结果
     */
    @DeleteMapping("/delete/{id}")
    public ApiResponse<Boolean> delete(@PathVariable(value = "id") Long id) {
        if (businessKnowledgeService.getKnowledgeById(id) == null) {
            return ApiResponse.error("业务知识不存在");
        }
        businessKnowledgeService.deleteKnowledge(id);
        return ApiResponse.success("删除业务知识成功");
    }

    /**
     * 设置生效状态
     *
     * @param id 业务知识ID
     * @param enabled 是否生效
     * @return 设置结果
     */
    @PostMapping("/enable/{id}")
    public ApiResponse<Boolean> enableKnowledge(@PathVariable(value = "id") Long id,
                                                 @RequestParam(value = "enabled") Boolean enabled) {
        businessKnowledgeService.recallKnowledge(id, enabled);
        return ApiResponse.success("设置生效状态成功");
    }

    /**
     * 刷新向量存储
     * 将所有召回的业务知识重新同步到向量库
     *
     * @return 刷新结果
     */
    @PostMapping("/refresh-vector-store")
    public ApiResponse<Boolean> refreshAllKnowledgeToVectorStore() {
        try {
            businessKnowledgeService.refreshAllKnowledgeToVectorStore();
            return ApiResponse.success("同步到向量库成功");
        } catch (Exception e) {
            log.error("刷新向量库失败", e);
            return ApiResponse.error("同步到向量库失败");
        }
    }

    /**
     * 重试向量化
     * 对失败的业务知识重新进行向量化
     *
     * @param id 业务知识ID
     * @return 重试结果
     */
    @PostMapping("/retry-embedding/{id}")
    public ApiResponse<Boolean> retryEmbedding(@PathVariable(value = "id") Long id) {
        businessKnowledgeService.retryEmbedding(id);
        return ApiResponse.success("重试向量化成功");
    }
}
