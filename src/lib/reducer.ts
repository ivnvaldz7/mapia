import type { Destination, RouteResult } from './types'

export interface AppState {
  destinations: Destination[]
  route: RouteResult | null
  loading: boolean
  errorMsg: string | null
  maxWarn: boolean
}

export type AppAction =
  | { type: 'ADD_DESTINATION'; payload: Destination }
  | { type: 'REMOVE_DESTINATION'; payload: string }
  | { type: 'SET_DESTINATIONS'; payload: Destination[] }
  | { type: 'SET_ROUTE'; payload: RouteResult | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_MAX_WARN'; payload: boolean }
  | { type: 'RESET' }
  | { type: 'TOGGLE_PIN'; payload: string }

export const initialState: AppState = {
  destinations: [],
  route: null,
  loading: false,
  errorMsg: null,
  maxWarn: false,
}

export function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_DESTINATION':
      return { ...state, destinations: [...state.destinations, action.payload] }
    case 'REMOVE_DESTINATION':
      return { ...state, destinations: state.destinations.filter((d) => d.id !== action.payload) }
    case 'SET_DESTINATIONS':
      return { ...state, destinations: action.payload }
    case 'SET_ROUTE':
      return { ...state, route: action.payload }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ERROR':
      return { ...state, errorMsg: action.payload }
    case 'SET_MAX_WARN':
      return { ...state, maxWarn: action.payload }
    case 'TOGGLE_PIN':
      return {
        ...state,
        destinations: state.destinations.map(d =>
          d.id === action.payload ? { ...d, isPinned: !d.isPinned } : d
        ),
      }
    case 'RESET':
      return initialState
  }
}
