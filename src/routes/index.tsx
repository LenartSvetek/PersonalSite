// import z from 'zod';

import { createFileRoute, Link } from '@tanstack/react-router'

// const personalSiteParamSchema = z.object({
//     game: z.enum(['64rdle', 'dueldle']).optional(),
//     connectTo: z.string().optional()
// });

export const Route = createFileRoute('/')({
    component: Index,
    // validateSearch: (search) => personalSiteParamSchema.parse(search)
})



function Index() {
    // const { game, connectTo } = Route.useSearch();
    // const navigate = useNavigate();

    // if(game) {
    //     if(game == "64rdle")
    //         navigate({to: `/64rdle`, search: { mode: 'daily' }});
    //     else if(game == "dueldle")
    //         navigate({to: '/dueldle', search: { connectTo }});
    // }

    return (
        <main>
            <Link to='/games'>Games</Link>
            {/* <Link to='/games/superSodoku'>super sodoku</Link> */}
        </main>
    )
}