# 1.0.0\(2026-02-26)
*  基于 springboot 和 vue 重构报表项目 

# 1.0.0\(2026-04-11)
*  前端项目提供库打包入口，生成 lib 包可直接嵌入业务系统

# 1.0.0\(2026-05-05)
*  升级前后端依赖，需要删除原来的依赖包重新 install

# 1.0.0\(2026-05-20)
*  支持分布式缓存

# 1.0.1\(2026-07-22)
*  支持多版本的 Spring Boot ，同时兼容 Spring Boot 2.x / 3.x / 4.x
*  新增 `luck-report-spring-boot2-starter`，支持 Spring Boot 2.7.x
*  新增 `luck-report-spring-boot3-starter`，支持 Spring Boot 3.x / 4.x
*  移除 `LuckReportMainConfig` 配置类

# 1.0.2\(2026-07-29)
*  新增 `luck-report-redis`，实现 redis 缓存功能
*  调整 `ReportCache`、`ReportCacheKeyResolver` 类路径
