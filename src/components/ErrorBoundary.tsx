import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-svh w-svw items-center justify-center bg-stone-900 text-white">
          <div className="text-center">
            <h2 className="mb-2 text-xl font-bold">Algo salió mal</h2>
            <p className="mb-4 text-stone-400">Ocurrió un error inesperado</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="rounded bg-stone-700 px-4 py-2 text-white hover:bg-stone-600"
            >
              Reintentar
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
