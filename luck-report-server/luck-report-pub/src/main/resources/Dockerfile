# https://docker.aityp.com/image/docker.io/openjdk:8-jre-alpine
FROM  swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/openjdk:8-jre-slim

# 安装缺失的 libfreetype6 库（解决 UnsatisfiedLinkError 核心步骤）
RUN apt update && \
    apt install -y --no-install-recommends \
    libfreetype6 \
    fontconfig \
    fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 将宿主机的 luck-report.jar 复制到容器的 /app 目录下
COPY luck-report-pub.jar /app/luck-report-pub.jar

# 暴露端口（根据你的 ureport2 项目实际端口修改，默认可能是 8080）
EXPOSE 8050

# 容器启动命令：运行 jar 包，指定 prod 环境，同时设置 JVM 优化参数（可选）
ENTRYPOINT ["java", "-jar", "/app/luck-report-pub.jar", "--spring.profiles.active=prod"]
