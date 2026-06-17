<template>
  <div class="home-page">
    <a-card class="welcome-card" :bordered="false">
      <div class="welcome-content">
        <div class="welcome-avatar">
          <img src="@/assets/images/avatar.png" alt="avatar" class="avatar-img" />
        </div>
        <div class="welcome-info">
          <div class="greeting-text">{{ greetingText }}，<span class="user-name">{{ userName }}</span></div>
          <div class="welcome-meta">
            <span class="date-text">{{ currentDate }}</span>
            <a-divider type="vertical" />
            <span class="weather-text">今日天气晴朗，适合工作</span>
          </div>
        </div>
      </div>
    </a-card>

    <a-row :gutter="[20, 20]" class="content-row">
      <a-col :xs="24" :sm="12" :lg="6">
        <a-card class="stat-card stat-card-green" :bordered="false">
          <div class="stat-content">
            <div class="stat-icon">
              <a-icon type="folder" />
            </div>
            <div class="stat-info">
              <div class="stat-value">12</div>
              <div class="stat-title">{{ $t('page.home.projectCount') }}</div>
            </div>
          </div>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :lg="6">
        <a-card class="stat-card stat-card-teal" :bordered="false">
          <div class="stat-content">
            <div class="stat-icon">
              <a-icon type="check-circle" />
            </div>
            <div class="stat-info">
              <div class="stat-value">28</div>
              <div class="stat-title">{{ $t('page.home.todo') }}</div>
            </div>
          </div>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :lg="6">
        <a-card class="stat-card stat-card-lime" :bordered="false">
          <div class="stat-content">
            <div class="stat-icon">
              <a-icon type="message" />
            </div>
            <div class="stat-info">
              <div class="stat-value">5</div>
              <div class="stat-title">{{ $t('page.home.message') }}</div>
            </div>
          </div>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :lg="6">
        <a-card class="stat-card stat-card-cyan" :bordered="false">
          <div class="stat-content">
            <div class="stat-icon">
              <a-icon type="team" />
            </div>
            <div class="stat-info">
              <div class="stat-value">36</div>
              <div class="stat-title">团队成员</div>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="[20, 20]" class="content-row equal-height-row">
      <a-col :xs="24" :lg="14">
        <a-card class="feature-card" :bordered="false">
          <div slot="title" class="card-header">
            <a-icon type="thunderbolt" />
            <span>快捷操作</span>
          </div>
          <div class="quick-action-grid">
            <div class="quick-action-item" v-for="item in quickActions" :key="item.key" @click="handleQuickAction(item)">
              <div class="action-icon" :style="{ background: item.color }">
                <a-icon :type="item.icon" />
              </div>
              <div class="action-name">{{ item.name }}</div>
            </div>
          </div>
        </a-card>
      </a-col>
      <a-col :xs="24" :lg="10">
        <a-card class="feature-card notice-card" :bordered="false">
          <div slot="title" class="card-header">
            <a-icon type="notification" />
            <span>系统公告</span>
          </div>
          <div class="notice-list">
            <div class="notice-item" v-for="(notice, index) in notices" :key="index">
              <a-tag :color="notice.type">{{ notice.tag }}</a-tag>
              <span class="notice-text">{{ notice.content }}</span>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'Home',
  data() {
    return {
      quickActions: [
        { key: 'report', name: '创建报表', icon: 'file-add', color: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)' },
        { key: 'template', name: '报表模板', icon: 'layout', color: 'linear-gradient(135deg, #13c2c2 0%, #36cfc9 100%)' },
        { key: 'data', name: '数据源', icon: 'database', color: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)' },
        { key: 'chart', name: '图表组件', icon: 'bar-chart', color: 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)' },
        { key: 'export', name: '导出报表', icon: 'export', color: 'linear-gradient(135deg, #fa8c16 0%, #ffa940 100%)' },
        { key: 'share', name: '分享协作', icon: 'share-alt', color: 'linear-gradient(135deg, #eb2f96 0%, #f759ab 100%)' },
        { key: 'setting', name: '系统设置', icon: 'setting', color: 'linear-gradient(135deg, #595959 0%, #8c8c8c 100%)' },
        { key: 'help', name: '帮助文档', icon: 'question-circle', color: 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)' }
      ],
      notices: [
        { type: 'green', tag: '更新', content: '系统已升级至最新版本 v2.0.0' },
        { type: 'cyan', tag: '通知', content: '报表设计器新增10种图表类型' },
        { type: 'lime', tag: '提醒', content: '请及时更新您的个人信息' },
        { type: 'geekblue', tag: '活动', content: '新用户专享功能体验活动进行中' }
      ]
    };
  },
  computed: {
    ...mapState({
      userName: state => state.user.info?.name || 'User'
    }),
    greetingText() {
      const hour = new Date().getHours();
      if (hour < 6) return '凌晨好';
      if (hour < 9) return '早上好';
      if (hour < 12) return '上午好';
      if (hour < 14) return '中午好';
      if (hour < 17) return '下午好';
      if (hour < 19) return '傍晚好';
      if (hour < 22) return '晚上好';
      return '夜深了';
    },
    currentDate() {
      const now = new Date();
      const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const day = now.getDate();
      const weekDay = weekDays[now.getDay()];
      return `${year}年${month}月${day}日 ${weekDay}`;
    }
  },
  methods: {
    handleQuickAction(item) {
      if (item.key === 'report') {
        this.$router.push('/report/designer');
      } else if (item.key === 'template') {
        this.$router.push('/report/manage');
      }
    }
  }
};
</script>

<style lang="less" scoped>
.home-page {
  background: #f0f2f5;
  border-radius: 8px;
  min-height: 100%;
}

.welcome-card {
  border-radius: 16px;
  margin-bottom: 20px;

  .welcome-content {
    display: flex;
    align-items: center;
    padding: 8px 0;
  }

  .welcome-avatar {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    overflow: hidden;
    margin-right: 20px;

    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .welcome-info {
    flex: 1;
  }

  .greeting-text {
    font-size: 20px;
    font-weight: 600;
    color: #262626;
    margin-bottom: 6px;

    .user-name {
      color: #52c41a;
    }
  }

  .welcome-meta {
    font-size: 14px;
    color: #8c8c8c;

    .ant-divider {
      margin: 0 12px;
    }
  }
}

.content-row {
  margin-top: 0 !important;
}

.equal-height-row {
  display: flex;
  flex-wrap: wrap;

  > .ant-col {
    display: flex;
  }
}

.stat-card {
  border-radius: 16px;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  }

  .stat-content {
    display: flex;
    align-items: center;
    padding: 4px 0;
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 14px;

    .anticon {
      font-size: 24px;
      color: #fff;
    }
  }

  .stat-info {
    flex: 1;
  }

  .stat-value {
    font-size: 24px;
    font-weight: 600;
    line-height: 1.2;
  }

  .stat-title {
    font-size: 13px;
    color: #8c8c8c;
    margin-top: 2px;
  }

  &.stat-card-green {
    .stat-icon {
      background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
    }
    .stat-value {
      color: #52c41a;
    }
  }

  &.stat-card-teal {
    .stat-icon {
      background: linear-gradient(135deg, #13c2c2 0%, #36cfc9 100%);
    }
    .stat-value {
      color: #13c2c2;
    }
  }

  &.stat-card-lime {
    .stat-icon {
      background: linear-gradient(135deg, #a0d911 0%, #bae637 100%);
    }
    .stat-value {
      color: #7cb305;
    }
  }

  &.stat-card-cyan {
    .stat-icon {
      background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
    }
    .stat-value {
      color: #1890ff;
    }
  }
}

.feature-card {
  border-radius: 16px;
  width: 100%;
  display: flex;
  flex-direction: column;

  /deep/ .ant-card-head {
    border-bottom: none;
    padding: 12px 20px;
    min-height: auto;
  }

  /deep/ .ant-card-body {
    padding: 0 20px 16px;
    flex: 1;
  }

  .card-header {
    display: flex;
    align-items: center;
    font-weight: 600;
    font-size: 15px;

    .anticon {
      margin-right: 8px;
      color: #52c41a;
      font-size: 16px;
    }
  }
}

.quick-action-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.quick-action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 6px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #f6ffed;
    transform: translateY(-2px);
  }

  .action-icon {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 6px;

    .anticon {
      font-size: 20px;
      color: #fff;
    }
  }

  .action-name {
    font-size: 12px;
    color: #595959;
  }
}

.notice-card {
  .notice-list {
    .notice-item {
      display: flex;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }

      .notice-text {
        flex: 1;
        margin-left: 10px;
        font-size: 13px;
        color: #595959;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
}

@media (max-width: 768px) {
  .home-page {
    padding: 16px;
  }

  .welcome-card {
    .welcome-avatar {
      width: 48px;
      height: 48px;
    }

    .greeting-text {
      font-size: 18px;
    }
  }

  .quick-action-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
