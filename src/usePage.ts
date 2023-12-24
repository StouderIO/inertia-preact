import { Page, PageProps } from '@inertiajs/core'
import { useContext } from 'preact/hooks'
import PageContext from './PageContext'

export default function usePage<
  TPageProps extends PageProps = PageProps,
>(): Page<TPageProps> {
  const page = useContext<Page<TPageProps>>(PageContext)

  if (!page) {
    throw new Error('usePage must be used within the Inertia component')
  }

  return page
}
