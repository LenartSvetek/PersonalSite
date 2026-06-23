import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/games/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <main>
              <Link to='/games/64rdle' search={{mode: 'daily'}}>64rdle</Link>
              <Link to='/games/dueldle'>duelde</Link>
              {/* <Link to='/games/superSodoku'>super sodoku</Link> */}
          </main>
}
