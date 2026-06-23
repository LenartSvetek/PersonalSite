import { useSSStore } from '@api/useSSStore'
import { createFileRoute, Link, Navigate, useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/games/superSodoku/')({
    component: RouteComponent,
})

function RouteComponent() {
    const navigate = useNavigate();
    
    const { depth, setDepth, startGame } = useSSStore();
    
    const onDepthChange = (ev : React.ChangeEvent<HTMLInputElement>) => {
        setDepth(ev.currentTarget.valueAsNumber);
    };

    const onGameStart = () => {
        startGame();
        navigate({to: '/games/superSodoku/game'});
    };

    return <div>
        <div>
            <input type='number' min={1} value={depth} onChange={onDepthChange}></input>
            <button onClick={onGameStart}>Play</button>
        </div>
    </div>
}
