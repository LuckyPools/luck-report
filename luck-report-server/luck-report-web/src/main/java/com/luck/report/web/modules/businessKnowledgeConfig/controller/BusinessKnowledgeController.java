package com.luck.report.web.modules.businessKnowledgeConfig.controller;

import com.luck.report.common.domain.vo.PageResultVO;
import com.luck.report.common.domain.vo.ResultVO;
import com.luck.report.web.modules.businessKnowledgeConfig.domain.dto.BusinessKnowledgeQueryDTO;
import com.luck.report.web.modules.businessKnowledgeConfig.domain.dto.CreateBusinessKnowledgeDTO;
import com.luck.report.web.modules.businessKnowledgeConfig.domain.dto.UpdateBusinessKnowledgeDTO;
import com.luck.report.web.modules.businessKnowledgeConfig.service.BusinessKnowledgeService;
import com.luck.report.web.modules.businessKnowledgeConfig.domain.vo.BusinessKnowledgeVO;
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
@RestController("bean.businessKnowledgeController")
@RequestMapping("${luck-report.servletPrefix:}/business-knowledge")
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
    public ResultVO<List<BusinessKnowledgeVO>> list(@RequestParam(value = "keyword", required = false) String keyword) {
        List<BusinessKnowledgeVO> result;

        if (StringUtils.hasText(keyword)) {
            result = businessKnowledgeService.searchKnowledge(keyword);
        } else {
            result = businessKnowledgeService.getKnowledge();
        }
        return ResultVO.success("查询业务知识列表成功", result);
    }

    /**
     * 分页查询业务知识列表
     *
     * @param queryDTO 查询条件
     * @return 分页结果
     */
    @PostMapping("/query/page")
    public PageResultVO<BusinessKnowledgeVO> queryByPage(@Validated @RequestBody BusinessKnowledgeQueryDTO queryDTO) {
        try {
            return businessKnowledgeService.queryByPage(queryDTO);
        } catch (Exception e) {
            log.error("分页查询业务知识列表失败", e);
            return PageResultVO.error("分页查询失败：" + e.getMessage());
        }
    }

    /**
     * 根据ID查询业务知识详情
     *
     * @param id 业务知识ID
     * @return 业务知识详情
     */
    @GetMapping("/detail/{id}")
    public ResultVO<BusinessKnowledgeVO> get(@PathVariable(value = "id") String id) {
        BusinessKnowledgeVO vo = businessKnowledgeService.getKnowledgeById(id);
        if (vo == null) {
            return ResultVO.error("业务知识不存在");
        }
        return ResultVO.success("查询业务知识详情成功", vo);
    }

    /**
     * 创建业务知识
     *
     * @param knowledge 创建业务知识DTO
     * @return 创建的业务知识
     */
    @PostMapping("/create")
    public ResultVO<BusinessKnowledgeVO> create(@RequestBody @Validated CreateBusinessKnowledgeDTO knowledge) {
        return ResultVO.success("创建业务知识成功", businessKnowledgeService.addKnowledge(knowledge));
    }

    /**
     * 更新业务知识
     *
     * @param id 业务知识ID
     * @param knowledge 更新业务知识DTO
     * @return 更新的业务知识
     */
    @PutMapping("/update/{id}")
    public ResultVO<BusinessKnowledgeVO> update(@PathVariable(value = "id") String id,
                                                    @RequestBody @Validated UpdateBusinessKnowledgeDTO knowledge) {
        return ResultVO.success("更新业务知识成功", businessKnowledgeService.updateKnowledge(id, knowledge));
    }

    /**
     * 删除业务知识
     *
     * @param id 业务知识ID
     * @return 删除结果
     */
    @DeleteMapping("/delete/{id}")
    public ResultVO<Boolean> delete(@PathVariable(value = "id") String id) {
        if (businessKnowledgeService.getKnowledgeById(id) == null) {
            return ResultVO.error("业务知识不存在", false);
        }
        businessKnowledgeService.deleteKnowledge(id);
        return ResultVO.success("删除业务知识成功", true);
    }

    /**
     * 设置生效状态
     *
     * @param id 业务知识ID
     * @param enabled 是否生效
     * @return 设置结果
     */
    @PostMapping("/enable/{id}")
    public ResultVO<Boolean> enableKnowledge(@PathVariable(value = "id") String id,
                                                 @RequestParam(value = "enabled") Boolean enabled) {
        businessKnowledgeService.recallKnowledge(id, enabled);
        return ResultVO.success("设置生效状态成功", true);
    }

    /**
     * 刷新向量存储
     * 将所有召回的业务知识重新同步到向量库
     *
     * @return 刷新结果
     */
    @PostMapping("/refresh-vector-store")
    public ResultVO<Boolean> refreshAllKnowledgeToVectorStore() {
        try {
            businessKnowledgeService.refreshAllKnowledgeToVectorStore();
            return ResultVO.success("同步到向量库成功", true);
        } catch (Exception e) {
            log.error("刷新向量库失败", e);
            return ResultVO.error("同步到向量库失败", false);
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
    public ResultVO<Boolean> retryEmbedding(@PathVariable(value = "id") String id) {
        businessKnowledgeService.retryEmbedding(id);
        return ResultVO.success("重试向量化成功", true);
    }
}
