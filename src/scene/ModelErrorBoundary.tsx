import { Component, type ReactNode } from 'react'

type Props = {
  /** File that is being loaded, for the warning. */
  url: string
  children: ReactNode
}

type State = { failed: boolean }

/** Keeps the hall running if a model fails to load; logs which file failed. */
export class ModelErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    const reason = error instanceof Error ? error.message : String(error)
    console.warn(`[model] Failed to load "${this.props.url}" — the case stays empty. Reason: ${reason}`)
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}
