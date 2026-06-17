<template>
  <a-layout class="base-layout">
    <a-layout-sider v-model="collapsed" :trigger="null" :width="200" style="background: #001529; overflow: hidden;">
      <div class="logo">
        <img src="@/assets/images/logo/logo.png" alt="logo" />
        <span v-show="!collapsed">{{ $t('system.title') }}</span>
      </div>
      <a-menu
        theme="dark"
        mode="inline"
        :selected-keys="[activeMenu]"
        @click="handleMenuClick"
        style="margin-top: 8px;"
      >
        <a-menu-item key="home">
          <a-icon type="home" />
          <span>{{ $t('route.home') }}</span>
        </a-menu-item>
        <a-sub-menu key="report-sub">
          <span slot="title"><a-icon type="file-text" /><span>{{ $t('route.report-manage') }}</span></span>
          <a-menu-item key="report-manage">
            <a-icon type="table" />
            <span>{{ $t('route.report-manage') }}</span>
          </a-menu-item>
        </a-sub-menu>
      </a-menu>
    </a-layout-sider>
    <a-layout>
      <a-layout-header class="header">
        <div class="header-left">
          <a-icon
            class="trigger"
            :type="collapsed ? 'menu-unfold' : 'menu-fold'"
            @click="collapsed = !collapsed"
          />
        </div>
        <div class="header-right">
          <a-dropdown>
            <span class="user-info">
              <a-icon type="user" />
              <span>{{ userName }}</span>
            </span>
            <a-menu slot="overlay">
              <a-menu-item key="logout" @click="handleLogout">
                <a-icon type="logout" />
                {{ $t('common.logout') }}
              </a-menu-item>
            </a-menu>
          </a-dropdown>
        </div>
      </a-layout-header>
      <a-layout-content class="content">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script>
import { mapState } from 'vuex';
import { logout } from '@/api/auth';
import { removeToken } from '@/utils/auth';

export default {
  name: 'BaseLayout',
  data() {
    return {
      collapsed: false
    };
  },
  computed: {
    ...mapState({
      userName: state => state.user.info?.name || 'User'
    }),
    activeMenu: {
      get() {
        const path = this.$route.path;
        if (path.startsWith('/report/manage')) {
          return 'report-manage';
        }
        if (path.startsWith('/report/designer')) {
          return 'report-designer';
        }
        if (path.startsWith('/report/preview')) {
          return 'report-preview';
        }
        return 'home';
      },
      set(val) {
        // setter needed for v-model
      }
    }
  },
  methods: {
    handleMenuClick({ key }) {
      const routeMap = {
        'home': '/home',
        'report-manage': '/report/manage',
        'report-designer': '/report/designer',
        'report-preview': '/report/preview'
      };
      const path = routeMap[key];
      if (path) {
        this.$router.push(path);
      }
    },
    async handleLogout() {
      try {
        await logout();
      } catch (e) {
        console.log('logout error:', e);
      } finally {
        removeToken();
        this.$store.dispatch('user/clearUserInfo');
        this.$router.push('/login');
      }
    }
  }
};
</script>

<style lang="less" scoped>
.base-layout {
  min-height: 100vh;
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  position: relative;
  z-index: 10;
  background: #001529;
  padding: 0 12px;
  overflow: hidden;
  box-sizing: border-box;
  width: 100%;

  img {
    width: 28px;
    height: 28px;
    margin-right: 8px;
    flex-shrink: 0;
  }

  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
  }
}

.header {
  background: #fff;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.header-left {
  display: flex;
  align-items: center;
}

.trigger {
  font-size: 18px;
  cursor: pointer;
  transition: color 0.3s;

  &:hover {
    color: #1890ff;
  }
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  cursor: pointer;
  display: flex;
  align-items: center;

  .anticon {
    margin-right: 8px;
  }
}

.content {
  margin: 16px;
  background: #fff;
  min-height: 280px;
}
</style>
