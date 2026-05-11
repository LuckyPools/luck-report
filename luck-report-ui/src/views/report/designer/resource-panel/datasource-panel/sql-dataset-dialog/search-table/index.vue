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
    <div class="table-container">
      <table class="data-table" style="font-size: 12px;">
        <thead>
          <tr style="height: 30px;background: #fafafa">
            <td style="width: 135px;"><span>{{ $t('dialog.sql.tableName') }}</span></td>
            <td style="width: 30px;"><span>{{ $t('dialog.sql.type') }}</span></td>
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
              <a href="###" :title="$t('dialog.sql.addSql')" @click="addSql(table.name)">
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
    db: {
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
      if (!this.db) return;

      this.searchKeyword = '';
      const type = this.db.type;
      const parameters = { type };

      if (type === 'jdbc') {
        parameters.username = this.db.username;
        parameters.password = this.db.password;
        parameters.driver = this.db.driver;
        parameters.url = this.db.url;
      } else if (type === 'buildin') {
        parameters.name = this.db.name;
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
.search-btn{
    vertical-align: middle;
    margin-left: 5px
}

.table-container {
    height: 380px; /* 减去搜索框和表头的高度 */
    overflow-y: auto;
    overflow-x: auto;
    border: 1px solid #ddd;
    border-top: none;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
}

.data-table td {
    border: 1px solid #ddd;
    padding: 4px;
    word-wrap: break-word;
}
</style>
