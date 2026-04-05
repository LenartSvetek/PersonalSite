

import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
    component: Index,
})



function Index() {
    
    return (
        <main>
            <Link to='/64rdle' search={{mode: 'daily'}}>64rdle</Link>
            <Link to='/dueldle'>duelde</Link>
        </main>
    )
}