<template>
  <div ref="hostRef" class="cm-host" :style="hostStyle"></div>
</template>

<script setup lang="ts">
/**
 * CodeMirror 6 Vue 3 极简包装器
 *
 * 只依赖 codemirror 核心包，不引任何语言包，
 * 适合自定义表达式（ds.field、cell("A1")、${...} 等）场景，
 * 避免 JS/SQL 严格语法造成的误报。
 *
 * 用法：
 *   <CodeMirror v-model="code" :basic-setup="true" placeholder="..." :height="160" />
 */
import { ref, onMounted, onBeforeUnmount, watch, shallowRef, computed } from 'vue'
import { Compartment, EditorState } from '@codemirror/state'
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLineGutter,
  highlightSpecialChars,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  highlightActiveLine,
  placeholder as placeholderExt
} from '@codemirror/view'
import { history, defaultKeymap, historyKeymap } from '@codemirror/commands'
import {
  foldGutter,
  indentOnInput,
  syntaxHighlighting,
  defaultHighlightStyle,
  bracketMatching,
  foldKeymap
} from '@codemirror/language'
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search'
import { closeBrackets } from '@codemirror/autocomplete'

defineOptions({ name: 'CodeMirror' })

interface Props {
  modelValue?: string
  basicSetup?: boolean
  placeholder?: string
  height?: number | string
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  basicSetup: true,
  placeholder: '',
  height: 160,
  readonly: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
}>()

const hostRef = ref<HTMLDivElement | null>(null)
const viewRef = shallowRef<EditorView | null>(null)
const readonlyCompartment = new Compartment()

const hostStyle = computed(() => ({
  height: typeof props.height === 'number' ? `${props.height}px` : props.height
}))

const placeholderExtension = (text: string) => placeholderExt(text)

const buildExtensions = () => {
  const list: any[] = []
  if (props.basicSetup) {
    // 手动展开 basicSetup 的各项基础扩展，显式不包含 autocompletion。
    // 本组件是"自定义表达式编辑器"，没有 SQL/JS 语法包，
    // 默认的关键词补全会出现误导性的"推荐值"（inline ghost text）。
    list.push(
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      foldGutter(),
      drawSelection(),
      dropCursor(),
      indentOnInput(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      bracketMatching(),
      closeBrackets(),
      highlightActiveLine(),
      highlightSelectionMatches(),
      rectangularSelection(),
      crosshairCursor(),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...searchKeymap
      ])
    )
  }
  list.push(EditorView.lineWrapping)
  list.push(
    EditorView.updateListener.of((u: any) => {
      if (u.docChanged) {
        const value = u.state.doc.toString()
        emit('update:modelValue', value)
        emit('change', value)
      }
    })
  )
  list.push(readonlyCompartment.of(EditorState.readOnly.of(props.readonly)))
  if (props.placeholder) list.push(placeholderExtension(props.placeholder))
  return list
}

onMounted(() => {
  if (!hostRef.value) return
  const state = EditorState.create({
    doc: props.modelValue || '',
    extensions: buildExtensions()
  })
  const view = new EditorView({
    state,
    parent: hostRef.value
  })
  viewRef.value = view
})

onBeforeUnmount(() => {
  viewRef.value?.destroy()
  viewRef.value = null
})

// 外部 v-model 变化 → 同步到编辑器
watch(
  () => props.modelValue,
  (val) => {
    const view = viewRef.value
    if (!view) return
    const current = view.state.doc.toString()
    if (current === val) return
    view.dispatch({
      changes: { from: 0, to: current.length, insert: val || '' }
    })
  }
)

// 只读状态变化
watch(
  () => props.readonly,
  (val) => {
    const view = viewRef.value
    if (!view) return
    view.dispatch({
      effects: readonlyCompartment.reconfigure(EditorState.readOnly.of(val))
    })
  }
)

defineExpose({
  getView: () => viewRef.value
})
</script>

<style>
.cm-host {
  width: 100%;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  overflow: hidden;
  background: #fff;
  transition: border-color 0.2s ease;
}
.cm-host .cm-editor {
  height: 100%;
  font-size: 13px;
}
.cm-host .cm-scroller {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
}
.cm-host .cm-focused {
  outline: none;
}
.cm-host:focus-within {
  border-color: var(--color-primary, #00554a);
  box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb, 0, 85, 74), 0.1);
}
.cm-host .cm-activeLine,
.cm-host .cm-activeLineGutter {
  background-color: rgba(var(--color-primary-rgb, 0, 85, 74), 0.08) !important;
}
.cm-host .cm-activeLine {
  border-left: 2px solid var(--color-primary, #00554a);
}
</style>