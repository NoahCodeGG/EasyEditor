import { configure } from 'mobx'

export const DEV = '_EASY_EDITOR_DEV_'

configure({
  // 仅能通过 action 来修改响应式数据
  enforceActions: 'always',
  // lint
  computedRequiresReaction: true,
  reactionRequiresObservable: true,
  observableRequiresReaction: true,
  disableErrorBoundaries: true,
})
