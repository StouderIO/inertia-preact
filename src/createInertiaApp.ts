import { Page, PageProps, PageResolver, setupProgress } from '@inertiajs/core'
import { ComponentType, h, FunctionComponent, Key, VNode } from 'preact'
import render from 'preact-render-to-string'
import App from './App'
import { HTMLAttributes } from 'preact/compat'

type ReactInstance = VNode
type ReactComponent = VNode

type HeadManagerOnUpdate = (elements: string[]) => void
type HeadManagerTitleCallback = (title: string) => string

type AppType<SharedProps extends PageProps = PageProps> = FunctionComponent<
  {
    children?: (props: {
      Component: ComponentType
      key: Key
      props: Page<SharedProps>['props']
    }) => VNode
  } & SetupOptions<unknown, SharedProps>['props']
>

export type SetupOptions<ElementType, SharedProps extends PageProps> = {
  el: ElementType
  App: AppType
  props: {
    initialPage: Page<SharedProps>
    initialComponent: ReactComponent
    resolveComponent: PageResolver
    titleCallback?: HeadManagerTitleCallback
    onHeadUpdate?: HeadManagerOnUpdate
  }
}

type BaseInertiaAppOptions = {
  title?: HeadManagerTitleCallback
  resolve: PageResolver
}

type CreateInertiaAppSetupReturnType = ReactInstance | void
type InertiaAppOptionsForCSR<SharedProps extends PageProps> =
  BaseInertiaAppOptions & {
    id?: string
    page?: Page | string
    render?: undefined
    progress?:
      | false
      | {
          delay?: number
          color?: string
          includeCSS?: boolean
          showSpinner?: boolean
        }
    setup(
      options: SetupOptions<HTMLElement, SharedProps>,
    ): CreateInertiaAppSetupReturnType
  }

type CreateInertiaAppSSRContent = { head: string[]; body: string }
type InertiaAppOptionsForSSR<SharedProps extends PageProps> =
  BaseInertiaAppOptions & {
    id?: undefined
    page: Page | string
    render: typeof render
    progress?: undefined
    setup(options: SetupOptions<null, SharedProps>): ReactInstance
  }

export default async function createInertiaApp<
  SharedProps extends PageProps = PageProps,
>(
  options: InertiaAppOptionsForCSR<SharedProps>,
): Promise<CreateInertiaAppSetupReturnType>
export default async function createInertiaApp<
  SharedProps extends PageProps = PageProps,
>(
  options: InertiaAppOptionsForSSR<SharedProps>,
): Promise<CreateInertiaAppSSRContent>
export default async function createInertiaApp<
  SharedProps extends PageProps = PageProps,
>({
  id = 'app',
  resolve,
  setup,
  title,
  progress = {},
  page,
  render,
}:
  | InertiaAppOptionsForCSR<SharedProps>
  | InertiaAppOptionsForSSR<SharedProps>): Promise<
  CreateInertiaAppSetupReturnType | CreateInertiaAppSSRContent
> {
  const isServer = typeof window === 'undefined'
  const el: HTMLElement | null = isServer ? null : document.getElementById(id)
  const initialPage = page || JSON.parse(el.dataset.page)
  const resolveComponent = (name: string) =>
    Promise.resolve(resolve(name))
      // @ts-expect-error default must exist
      .then((module) => module.default || module)
      .catch(() => {
        throw new Error(`Cannot resolve component "${name}".`)
      })

  let head = []

  const reactApp = await resolveComponent(initialPage.component).then(
    (initialComponent) => {
      return setup({
        // @ts-expect-error can either be HTMLElement or null
        el,
        App,
        props: {
          initialPage,
          initialComponent,
          resolveComponent,
          titleCallback: title,
          onHeadUpdate: isServer ? (elements) => (head = elements) : null,
        },
      })
    },
  )

  if (!isServer && progress) {
    setupProgress(progress)
  }

  if (isServer) {
    const body = render(
      h<HTMLAttributes<HTMLDivElement>, HTMLDivElement>(
        'div',
        {
          id,
          'data-page': JSON.stringify(initialPage),
        } as HTMLAttributes<HTMLDivElement>,
        // @ts-expect-error can be void or ReactInstance
        reactApp,
      ),
    )

    return { head, body }
  }
}
