import { PartyProvider } from '@api/PartyProvider'
import { Party } from '@components/party/Party'
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/games')({
  component: GamesLayout,
})

function GamesLayout() {
  return <PartyProvider>
    <Outlet />
    <Party />
  </PartyProvider>
}
