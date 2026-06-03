<template>
  <div class="test-page">
    <TypographyTitle :level="2">Ant Design Vue 组件测试</TypographyTitle>

    <Divider>任务进度组件测试</Divider>

    <Space direction="vertical" :size="16" style="width: 100%">
      <TypographyTitle :level="4">任务进度展示 - 执行中状态</TypographyTitle>
      <TaskProgressDisplay
        :tasks="mockTasksInProgress"
        current-workflow-node="正在修改报表单元格..."
      />

      <TypographyTitle :level="4">任务进度展示 - 已完成状态</TypographyTitle>
      <TaskProgressDisplay
        :tasks="mockTasksCompleted"
        current-workflow-node="任务已全部完成"
      />

      <TypographyTitle :level="4">任务进度展示 - 待执行状态</TypographyTitle>
      <TaskProgressDisplay
        :tasks="mockTasksPending"
        current-workflow-node="正在规划任务..."
      />

      <TypographyTitle :level="4">任务进度展示 - 混合状态</TypographyTitle>
      <TaskProgressDisplay
        :tasks="mockTasksMixed"
        current-workflow-node="正在加载报表文档..."
      />
    </Space>

    <Divider>基础组件</Divider>

    <Space direction="vertical" :size="16" style="width: 100%">
      <TypographyTitle :level="4">Button 按钮</TypographyTitle>
      <Space>
        <Button type="primary">Primary</Button>
        <Button>Default</Button>
        <Button type="dashed">Dashed</Button>
        <Button type="text">Text</Button>
        <Button type="link">Link</Button>
      </Space>

      <TypographyTitle :level="4">Icon 图标</TypographyTitle>
      <Space>
        <HomeOutlined style="font-size: 24px" />
        <SettingOutlined style="font-size: 24px" />
        <SmileOutlined style="font-size: 24px" />
        <SearchOutlined style="font-size: 24px" />
      </Space>

      <TypographyTitle :level="4">Typography 排版</TypographyTitle>
      <Typography>
        <TypographyTitle>标题 H1</TypographyTitle>
        <TypographyText>普通文本</TypographyText>
        <TypographyText type="secondary">次要文本</TypographyText>
        <TypographyText type="success">成功文本</TypographyText>
        <TypographyText type="warning">警告文本</TypographyText>
        <TypographyText type="danger">错误文本</TypographyText>
      </Typography>
    </Space>

    <Divider>布局组件</Divider>

    <Space direction="vertical" :size="16" style="width: 100%">
      <TypographyTitle :level="4">Flex 弹性布局</TypographyTitle>
      <Flex gap="small" wrap="wrap">
        <Button v-for="i in 4" :key="i">Button {{ i }}</Button>
      </Flex>

      <TypographyTitle :level="4">Grid 栅格</TypographyTitle>
      <Row :gutter="16">
        <Col :span="6"><div class="grid-box">col-6</div></Col>
        <Col :span="6"><div class="grid-box">col-6</div></Col>
        <Col :span="6"><div class="grid-box">col-6</div></Col>
        <Col :span="6"><div class="grid-box">col-6</div></Col>
      </Row>

      <TypographyTitle :level="4">Layout 布局</TypographyTitle>
      <Layout class="demo-layout">
        <LayoutHeader class="demo-header">Header</LayoutHeader>
        <Layout>
          <LayoutSider class="demo-sider" width="100">Sider</LayoutSider>
          <LayoutContent class="demo-content">Content</LayoutContent>
        </Layout>
        <LayoutFooter class="demo-footer">Footer</LayoutFooter>
      </Layout>
    </Space>

    <Divider>导航组件</Divider>

    <Space direction="vertical" :size="16" style="width: 100%">
      <TypographyTitle :level="4">Menu 菜单</TypographyTitle>
      <Menu mode="horizontal" v-model:selectedKeys="selectedKeys">
        <MenuItem key="mail">Navigation One</MenuItem>
        <MenuItem key="app">Navigation Two</MenuItem>
        <MenuItem key="alipay">Navigation Three</MenuItem>
      </Menu>

      <TypographyTitle :level="4">Pagination 分页</TypographyTitle>
      <Pagination v-model:current="current" :total="50" show-less-items />

      <TypographyTitle :level="4">Steps 步骤条</TypographyTitle>
      <Steps :current="1">
        <Step title="Finished" description="This is a description." />
        <Step title="In Progress" description="This is a description." />
        <Step title="Waiting" description="This is a description." />
      </Steps>
    </Space>

    <Divider>数据录入</Divider>

    <Space direction="vertical" :size="16" style="width: 100%">
      <TypographyTitle :level="4">Form 表单</TypographyTitle>
      <Form ref="formRef" :model="formState" :rules="formRules" layout="vertical" style="max-width: 500px">
        <FormItem label="Username" name="username">
          <Input v-model:value="formState.username" placeholder="请输入用户名" />
        </FormItem>
        <FormItem label="Password" name="password">
          <InputPassword v-model:value="formState.password" placeholder="请输入密码" />
        </FormItem>
        <FormItem label="Email" name="email">
          <Input v-model:value="formState.email" placeholder="请输入邮箱" />
        </FormItem>
        <FormItem>
          <Space>
            <Button type="primary" @click="handleFormSubmit">提交</Button>
            <Button @click="handleFormReset">重置</Button>
          </Space>
        </FormItem>
      </Form>

      <TypographyTitle :level="4">Input 输入框</TypographyTitle>
      <Space direction="vertical">
        <Input v-model:value="inputValue" placeholder="Basic input" />
        <InputNumber v-model:value="numberValue" :min="1" :max="10" />
      </Space>

      <TypographyTitle :level="4">Select 选择器</TypographyTitle>
      <Select v-model:value="selectValue" style="width: 200px" placeholder="请选择">
        <SelectOption value="jack">Jack</SelectOption>
        <SelectOption value="lucy">Lucy</SelectOption>
      </Select>

      <TypographyTitle :level="4">Checkbox / Radio / Switch</TypographyTitle>
      <Space>
        <Checkbox v-model:checked="checked">Checkbox</Checkbox>
        <Switch v-model:checked="switchValue" />
      </Space>
      <RadioGroup v-model:value="radioValue">
        <Radio value="a">A</Radio>
        <Radio value="b">B</Radio>
        <Radio value="c">C</Radio>
      </RadioGroup>

      <TypographyTitle :level="4">DatePicker / Slider / Rate</TypographyTitle>
      <Space>
        <DatePicker v-model:value="dateValue" />
      </Space>
      <Slider v-model:value="sliderValue" style="width: 200px" />
      <Rate v-model:value="rateValue" />
    </Space>

    <Divider>数据展示</Divider>

    <Space direction="vertical" :size="16" style="width: 100%">
      <TypographyTitle :level="4">Card 卡片</TypographyTitle>
      <Card title="Card title" style="width: 300px">
        <p>Card content</p>
      </Card>

      <TypographyTitle :level="4">Table 表格</TypographyTitle>
      <Table :columns="columns" :data-source="data" :pagination="false" size="small" />

      <TypographyTitle :level="4">Tabs 标签页</TypographyTitle>
      <Tabs v-model:activeKey="activeTab">
        <TabPane key="1" tab="Tab 1">Content of Tab 1</TabPane>
        <TabPane key="2" tab="Tab 2">Content of Tab 2</TabPane>
        <TabPane key="3" tab="Tab 3">Content of Tab 3</TabPane>
      </Tabs>

      <TypographyTitle :level="4">Tag / Badge / Avatar</TypographyTitle>
      <Space>
        <Tag>Tag 1</Tag>
        <Tag color="success">success</Tag>
        <Tag color="processing">processing</Tag>
        <Tag color="error">error</Tag>
      </Space>
      <br />
      <Badge :count="5">
        <Avatar shape="square" :size="40" />
      </Badge>
      <Avatar :size="64">
        <template #icon><UserOutlined /></template>
      </Avatar>

      <TypographyTitle :level="4">Tree 树形控件</TypographyTitle>
      <Tree :tree-data="treeData" default-expand-all />

      <TypographyTitle :level="4">Collapse 折叠面板</TypographyTitle>
      <Collapse v-model:activeKey="collapseKey">
        <CollapsePanel key="1" header="This is panel header 1">
          <p>Panel content 1</p>
        </CollapsePanel>
        <CollapsePanel key="2" header="This is panel header 2">
          <p>Panel content 2</p>
        </CollapsePanel>
      </Collapse>

      <TypographyTitle :level="4">Empty / QRCode</TypographyTitle>
      <Empty />
      <QRCode value="https://www.antdv.com" />
    </Space>

    <Divider>反馈组件</Divider>

    <Space direction="vertical" :size="16" style="width: 100%">
      <TypographyTitle :level="4">Alert 警告提示</TypographyTitle>
      <Space direction="vertical" style="width: 100%">
        <Alert message="Success Text" type="success" />
        <Alert message="Info Text" type="info" />
        <Alert message="Warning Text" type="warning" />
        <Alert message="Error Text" type="error" />
      </Space>

      <TypographyTitle :level="4">Modal 对话框</TypographyTitle>
      <Button type="primary" @click="showModal">Open Modal</Button>
      <Modal v-model:open="modalVisible" title="Basic Modal" @ok="handleModalOk">
        <p>Some contents...</p>
      </Modal>

      <TypographyTitle :level="4">Drawer 抽屉</TypographyTitle>
      <Button type="primary" @click="showDrawer">Open Drawer</Button>
      <Drawer v-model:open="drawerVisible" title="Basic Drawer" placement="right">
        <p>Some contents...</p>
      </Drawer>

      <TypographyTitle :level="4">Message 全局提示</TypographyTitle>
      <Space>
        <Button @click="showMessage('success')">Success</Button>
        <Button @click="showMessage('error')">Error</Button>
        <Button @click="showMessage('warning')">Warning</Button>
      </Space>

      <TypographyTitle :level="4">Progress 进度条</TypographyTitle>
      <Progress :percent="30" />
      <Progress :percent="50" status="active" />
      <Progress :percent="70" status="exception" />

      <TypographyTitle :level="4">Spin / Skeleton / Result</TypographyTitle>
      <Spin />
      <Skeleton />
      <Result status="success" title="Successfully!" style="padding: 20px 0">
        <template #extra>
          <Button type="primary">Go Console</Button>
        </template>
      </Result>
    </Space>

    <Divider>其他组件</Divider>

    <Space direction="vertical" :size="16" style="width: 100%">
      <TypographyTitle :level="4">Statistic 统计数值</TypographyTitle>
      <Statistic title="Active Users" :value="112893" />

      <TypographyTitle :level="4">Segmented 分段控制器</TypographyTitle>
      <Segmented v-model:value="segmentedValue" :options="['Daily', 'Weekly', 'Monthly']" />
    </Space>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import type { Rule } from 'ant-design-vue/es/form'
import {
  HomeOutlined,
  SettingOutlined,
  SmileOutlined,
  SearchOutlined,
  UserOutlined
} from '@ant-design/icons-vue'
import TaskProgressDisplay from '@/views/chat/components/TaskProgressDisplay.vue'
import type { Task } from '@/views/agent/tools/types'

import {
  TypographyTitle,
  TypographyText,
  Typography,
  Divider,
  Space,
  Button,
  Flex,
  Row,
  Col,
  Layout,
  LayoutHeader,
  LayoutSider,
  LayoutContent,
  LayoutFooter,
  Menu,
  MenuItem,
  Pagination,
  Steps,
  Step,
  Form,
  FormItem,
  Input,
  InputNumber,
  InputPassword,
  Select,
  SelectOption,
  Checkbox,
  Radio,
  RadioGroup,
  Switch,
  DatePicker,
  Slider,
  Rate,
  Card,
  Table,
  Tabs,
  TabPane,
  Tag,
  Badge,
  Avatar,
  Tree,
  Collapse,
  CollapsePanel,
  Empty,
  QRCode,
  Alert,
  Modal,
  Drawer,
  Progress,
  Spin,
  Skeleton,
  Result,
  Statistic,
  Segmented
} from 'ant-design-vue'

const selectedKeys = ref(['mail'])
const current = ref(2)
const activeTab = ref('1')
const collapseKey = ref(['1'])
const segmentedValue = ref('Daily')

const formRef = ref<FormInstance>()

const formState = reactive({
  username: '',
  password: '',
  email: ''
})

const formRules: Record<string, Rule[]> = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度为 3-20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为 6-20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ]
}

const handleFormSubmit = async () => {
  try {
    await formRef.value?.validate()
    message.success('表单提交成功！')
    console.log('Form values:', formState)
  } catch (error) {
    message.error('请检查表单填写是否正确')
  }
}

const handleFormReset = () => {
  formRef.value?.resetFields()
}

const inputValue = ref('')
const numberValue = ref(3)
const selectValue = ref<string | undefined>(undefined)
const checked = ref(false)
const radioValue = ref('a')
const switchValue = ref(false)
const dateValue = ref()
const sliderValue = ref(30)
const rateValue = ref(2)

const modalVisible = ref(false)
const drawerVisible = ref(false)

const showModal = () => {
  modalVisible.value = true
}

const handleModalOk = () => {
  modalVisible.value = false
}

const showDrawer = () => {
  drawerVisible.value = true
}

const showMessage = (type: 'success' | 'error' | 'warning') => {
  message[type]('This is a ' + type + ' message')
}

const columns = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Age', dataIndex: 'age', key: 'age' },
  { title: 'Address', dataIndex: 'address', key: 'address' }
]

const data = [
  { key: '1', name: 'John Brown', age: 32, address: 'New York No. 1 Lake Park' },
  { key: '2', name: 'Jim Green', age: 42, address: 'London No. 1 Lake Park' },
  { key: '3', name: 'Joe Black', age: 32, address: 'Sidney No. 1 Lake Park' }
]

const treeData = [
  {
    title: 'Node1',
    key: '0-0',
    children: [
      { title: 'Child Node1', key: '0-0-0' },
      { title: 'Child Node2', key: '0-0-1' }
    ]
  },
  {
    title: 'Node2',
    key: '0-1'
  }
]

// 模拟任务数据 - 执行中状态
const mockTasksInProgress: Task[] = [
  {
    id: '1',
    content: '可行性分析',
    status: 'completed',
    timestamp: Date.now() - 10000
  },
  {
    id: '2',
    content: '加载报表文档',
    status: 'completed',
    timestamp: Date.now() - 8000
  },
  {
    id: '3',
    content: '修改单元格属性',
    status: 'in_progress',
    timestamp: Date.now() - 5000
  },
  {
    id: '4',
    content: '验证修改结果',
    status: 'pending',
    timestamp: Date.now()
  },
  {
    id: '5',
    content: '生成最终报表',
    status: 'pending',
    timestamp: Date.now()
  }
]

// 模拟任务数据 - 已完成状态
const mockTasksCompleted: Task[] = [
  {
    id: '1',
    content: '可行性分析',
    status: 'completed',
    timestamp: Date.now() - 15000
  },
  {
    id: '2',
    content: '加载报表文档',
    status: 'completed',
    timestamp: Date.now() - 12000
  },
  {
    id: '3',
    content: '修改单元格属性',
    status: 'completed',
    timestamp: Date.now() - 8000
  },
  {
    id: '4',
    content: '验证修改结果',
    status: 'completed',
    timestamp: Date.now() - 5000
  },
  {
    id: '5',
    content: '生成最终报表',
    status: 'completed',
    timestamp: Date.now()
  }
]

// 模拟任务数据 - 待执行状态
const mockTasksPending: Task[] = [
  {
    id: '1',
    content: '可行性分析',
    status: 'pending',
    timestamp: Date.now()
  },
  {
    id: '2',
    content: '加载报表文档',
    status: 'pending',
    timestamp: Date.now()
  },
  {
    id: '3',
    content: '修改单元格属性',
    status: 'pending',
    timestamp: Date.now()
  },
  {
    id: '4',
    content: '验证修改结果',
    status: 'pending',
    timestamp: Date.now()
  },
  {
    id: '5',
    content: '生成最终报表',
    status: 'pending',
    timestamp: Date.now()
  }
]

// 模拟任务数据 - 混合状态
const mockTasksMixed: Task[] = [
  {
    id: '1',
    content: '可行性分析',
    status: 'completed',
    timestamp: Date.now() - 12000
  },
  {
    id: '2',
    content: '加载报表文档',
    status: 'in_progress',
    timestamp: Date.now() - 8000
  },
  {
    id: '3',
    content: '修改单元格属性',
    status: 'pending',
    timestamp: Date.now()
  },
  {
    id: '4',
    content: '验证修改结果',
    status: 'pending',
    timestamp: Date.now()
  },
  {
    id: '5',
    content: '生成最终报表',
    status: 'cancelled',
    timestamp: Date.now()
  }
]
</script>

<style scoped>
.test-page {
  padding: 24px;
  background: #fff;
  min-height: 100vh;
}

.grid-box {
  padding: 16px 0;
  text-align: center;
  background: #f0f2f5;
  border-radius: 4px;
}

.demo-layout {
  min-height: 200px;
  background: #f0f2f5;
}

.demo-header {
  background: #7dbcea;
  color: #fff;
  line-height: 64px;
  text-align: center;
}

.demo-sider {
  background: #3ba0e9;
  color: #fff;
  line-height: 120px;
  text-align: center;
}

.demo-content {
  background: #108ee9;
  color: #fff;
  min-height: 120px;
  line-height: 120px;
  text-align: center;
}

.demo-footer {
  background: #7dbcea;
  color: #fff;
  text-align: center;
}
</style>
