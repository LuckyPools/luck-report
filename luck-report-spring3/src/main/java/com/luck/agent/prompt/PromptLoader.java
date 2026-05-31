package com.luck.agent.prompt;

import lombok.extern.slf4j.Slf4j;
import org.springframework.util.StreamUtils;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 提示词加载器
 * 从 classpath:prompt/ 目录加载提示词模板文件，并缓存已加载的内容
 *
 * @author luck
 */
@Slf4j
public class PromptLoader {

    private static final String PROMPT_PATH_PREFIX = "prompt/";

    private static final ConcurrentHashMap<String, String> promptCache = new ConcurrentHashMap<>();

    /**
     * 从文件加载提示词模板
     * 优先从缓存获取，缓存不存在则从文件系统加载并缓存
     *
     * @param promptName 提示词文件名（不含路径和扩展名）
     * @return 提示词内容
     * @throws RuntimeException 当提示词文件不存在或读取失败时抛出
     */
    public static String loadPrompt(String promptName) {
        return promptCache.computeIfAbsent(promptName, name -> {
            String fileName = PROMPT_PATH_PREFIX + name + ".txt";
            try (InputStream inputStream = PromptLoader.class.getClassLoader().getResourceAsStream(fileName)) {
                if (inputStream == null) {
                    throw new RuntimeException("提示词文件不存在: " + fileName);
                }
                return StreamUtils.copyToString(inputStream, StandardCharsets.UTF_8);
            } catch (IOException e) {
                log.error("加载提示词失败！{}", e.getMessage(), e);
                throw new RuntimeException("加载提示词失败: " + name, e);
            }
        });
    }

    /**
     * 清空提示词缓存
     * 用于热更新场景，重新加载提示词文件
     */
    public static void clearCache() {
        promptCache.clear();
    }

    /**
     * 获取缓存中的提示词数量
     * todo 使用系统级缓存 CacheService
     * @return 缓存中的提示词数量
     */
    public static int getCacheSize() {
        return promptCache.size();
    }

}
