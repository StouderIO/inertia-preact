import { createContext } from 'preact'

const headContext = createContext(undefined)
headContext.displayName = 'InertiaHeadContext'

export default headContext
