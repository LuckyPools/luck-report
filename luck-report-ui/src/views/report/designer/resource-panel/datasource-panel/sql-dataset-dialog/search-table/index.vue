<template>
  <div style="width: 250px; height: 450px;">
    <div class="form-group" style="margin-bottom: 5px;">
      <div class="u-inline">
        <u-input
          v-model="searchKeyword"
          :placeholder="$t('dialog.sql.search')"
          style="width: 190px;"
        />
      </div>
      <div class="u-inline" style="vertical-align: middle;margin-left: 5px">
          <u-button
              type="info"
              icon="icon-search"
              class="search-bth"
          >
          </u-button>
      </div>
    </div>
    <div class="table-wrapper">
      <table class="table-container" style="font-size: 12px;">
        <thead>
          <tr>
            <th style="width: 135px;"><span>{{ $t('dialog.sql.tableName') }}</span></th>
            <th style="width: 30px;"><span>{{ $t('dialog.sql.type') }}</span></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(table, index) in filteredTables"
            :key="`${table.name}-${index}`"
            style="height: 30px"
            @dblclick="addSql(table.name)"
          >
            <td>
              <a href="javascript:void(0)" :title="$t('dialog.sql.addSql')" @click="addSql(table.name)">
                {{ table.name }}
              </a>
            </td>
            <td>
              <span :style="{color: table.type === 'TABLE' ? '#49a700' : '#8B2252'}">
                {{ table.type === 'TABLE' ? $t('dialog.sql.table') : $t('dialog.sql.view') }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { showAlert } from '@/utils/comnon.js';
import { buildDatabaseTables } from '@/api/designer';
import UInput from '@/components/input/index.vue';
import UButton from "@/components/button/index.vue";

export default {
  name: 'SearchTable',
  components: {
    UButton,
    UInput
  },
  props: {
    datasourceData: {
      type: Object
    },
    triggerLoad: {
      type: Boolean,
      default: false
    }
  },
  emits: ['add', 'load-complete'],
  data() {
    return {
      tables: [],
      searchKeyword: ''
    }
  },
  watch: {
    triggerLoad(newVal) {
      if (newVal) {
        this.loadDatabaseTables();
        this.$emit('load-complete');
      }
    }
  },
  computed: {
    filteredTables() {
      if (!this.searchKeyword) {
        return this.tables
      }
      const keyword = this.searchKeyword.toLowerCase()
      return this.tables.filter(table =>
        table.name.toLowerCase().includes(keyword)
      )
    }
  },
  methods: {
    setTables(tables) {
      this.tables = tables
    },
    addSql(tableName) {
      const sql = `select * from ${tableName}`
      this.$emit('add', sql)
    },
    /**
     * 加载数据库表格列表
     */
    async loadDatabaseTables() {
      if (!this.datasourceData) return;

      this.searchKeyword = '';
      const type = this.datasourceData.type;
      const parameters = { type };

      if (type === 'jdbc') {
        parameters.username = this.datasourceData.username;
        parameters.password = this.datasourceData.password;
        parameters.driver = this.datasourceData.driver;
        parameters.url = this.datasourceData.url;
      } else if (type === 'buildin') {
        parameters.name = this.datasourceData.name;
        // 确保 type 参数被正确设置
        parameters.type = 'buildin';
      }

      try {
        const tables = await buildDatabaseTables(parameters);
        this.setTables(tables);
      } catch (error) {
        if (error.msg) {
          showAlert(this.$t('dialog.save.serverError') + this.$t('colon') + error.msg, { useHTMLString: true });
        } else {
          showAlert(this.$t('dialog.sql.loadFail'));
        }
      }
    }
  }
}
</script>

<style scoped>

.table-container {
    width: 100%;
    table-layout: fixed;
}

.table-container td {
    padding: 4px;
    word-wrap: break-word;
}
</style>
