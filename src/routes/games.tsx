import { PartyProvider } from '@api/PartyProvider'
import { UserProvider } from '@api/UserProvider'
import { Party } from '@components/party/Party'
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/games')({
    component: GamesLayout,
})

function GamesLayout() {

    return <>
        <UserProvider>
            <PartyProvider>
                <Outlet />
                <Party />
            </PartyProvider>
        </UserProvider>
    </>
}
