#!/bin/bash
# Dockerfile、jar包、start.sh要在同一目录下
# 脚本配置（根据你的实际情况修改）
JAR_FILE="luck-report-pub.jar"          # jar包名称
DOCKERFILE_PATH="./"                 # Dockerfile所在目录（当前目录为./）
IMAGE_NAME="luck-report-pub:prod"       # 新镜像名称和标签
CONTAINER_NAME="luck-report-pub-prod"   # 容器名称
PORT_MAPPING="8050:8050"             # 端口映射（宿主机:容器）
VOLUME_MAPPING="/home/soft/luck-report/files/:/home/soft/luck-report/files/"  # 目录映射配置（宿主机路径:容器路径）

# 脚本颜色输出（可选，增强可读性）
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 函数：打印信息
info() {
    echo -e "${GREEN}[INFO] $1${NC}"
}

# 函数：打印警告
warn() {
    echo -e "${YELLOW}[WARN] $1${NC}"
}

# 函数：打印错误并退出
error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

# 1. 检查jar包是否存在
info "===== 检查jar包是否存在 ====="
if [ ! -f "${JAR_FILE}" ]; then
    error "未找到${JAR_FILE}文件，请确认文件路径是否正确！"
fi
info "${JAR_FILE}文件存在，检查通过。"

# 2. 停止并删除旧容器
info "===== 清理旧容器 ====="
if [ "$(docker ps -a | grep ${CONTAINER_NAME})" ]; then
    info "停止容器${CONTAINER_NAME}..."
    docker stop ${CONTAINER_NAME} || warn "停止容器失败（容器可能已停止）"

    info "删除容器${CONTAINER_NAME}..."
    docker rm ${CONTAINER_NAME} || error "删除容器失败，请手动清理后重试！"
else
    info "未找到容器${CONTAINER_NAME}，无需清理。"
fi

# 3. 删除旧镜像
info "===== 清理旧镜像 ====="
if [ "$(docker images | grep ${IMAGE_NAME%%:*} | grep ${IMAGE_NAME##*:})" ]; then
    info "删除镜像${IMAGE_NAME}..."
    docker rmi ${IMAGE_NAME} || error "删除镜像失败，请手动清理后重试！"
else
    info "未找到镜像${IMAGE_NAME}，无需清理。"
fi

# 4. 构建新镜像
info "===== 构建新镜像 ====="
docker build --pull=false -t ${IMAGE_NAME} -f "${DOCKERFILE_PATH}/Dockerfile" "${DOCKERFILE_PATH}" || error "镜像构建失败！"
info "镜像${IMAGE_NAME}构建成功。"

# 5. 启动新容器
info "===== 启动新容器 ====="
# 容器异常退出时自动重启（可选）
docker run -d \
    --name ${CONTAINER_NAME} \
    -p ${PORT_MAPPING} \
    -v ${VOLUME_MAPPING} \
    --restart=always \
    ${IMAGE_NAME} || error "容器启动失败！"

# 6. 验证启动结果
info "===== 验证启动状态 ====="
sleep 3  # 等待容器启动
if [ "$(docker ps | grep ${CONTAINER_NAME})" ]; then
    info "容器${CONTAINER_NAME}启动成功！"
    info "访问地址：http://本机IP:${PORT_MAPPING%%:*}"
else
    error "容器启动失败，请执行 docker logs ${CONTAINER_NAME} 查看日志！"
fi

info "===== 脚本执行完成 ====="
exit 0
