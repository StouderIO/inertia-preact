import { createContext } from 'preact'

const pageContext = createContext(undefined)
pageContext.displayName = 'InertiaPageContext'

export default pageContext
