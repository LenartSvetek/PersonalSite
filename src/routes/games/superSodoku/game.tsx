import { useSSStore, type ICellState } from '@api/useSSStore'
import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useState } from 'react';

export const Route = createFileRoute('/games/superSodoku/game')({
  component: RouteComponent,
})

import styles from './game.module.css';

function RouteComponent() {
    const { getCell, play, depth, playerTurn } = useSSStore();
    
    const [ playCell, setPlayCell ] = useState<number[]>([]);
    
    // const gameCell = playCell.length == 0 && getCell([]) || getCell([...playCell].splice(0, playCell.length - 1));
    
    const gameCell = useMemo(() => {
        if(playCell.length == 0) return getCell([]);
        return getCell([...playCell].slice(0, -1));
    }, 
    [playerTurn]);
    const currentCell = useMemo(() => {
        return playCell[playCell.length - 1] || null;
    }, [gameCell])
    
   if (!gameCell) return null;

    const onCellSelect = useCallback((path : number[]) => {
        setPlayCell((playCell) => {
            let _plyCell = [...playCell, ...path];
            
            if(_plyCell.length == depth - 1) {
                if(play(_plyCell) !== 'noset' && _plyCell.length != 0) {
                    _plyCell.pop();
                    return [..._plyCell, path[0]];
                }

                return [..._plyCell];
            }
            else {
                let cell = getCell([...playCell, path[0]]);
                if(cell.winner == '')
                    return [...playCell, path[1] || path[0]];
                return [...playCell];
            };
        })
    }, [playCell])

    console.log(gameCell, playCell);

    return (
        <div className={styles.gametable}>
            {gameCell.winner !== '' ? (
                <div key="KrNek">{gameCell.winner}</div>
            ) : (
                gameCell.cells?.map((cell, i) => (
                    <div key={`cell_wrapper_${i}`} style={i == currentCell && { backgroundColor: "red" } || {}}>
                        {
                            (!cell.cells || cell.winner !== '') &&
                            <div className={`${styles.lastItem}`} onClick={() => onCellSelect([i])}>{cell.winner}</div> ||
                            <div className={`${styles.gametable}`}>
                                {
                                    cell.winner !== '' &&
                                    <div className={`${styles.lastItem}`}>{cell.winner}</div> ||
                                    cell.cells != undefined &&
                                    cell.cells.map((inlineCell, j) => (
                                        <div id={`inncell_${i}_${j}`} key={`inncell_${i}_${j}`} className={`${styles.lastItem}`} onClick={() => onCellSelect([i, j])}>
                                            {inlineCell.winner !== '' && inlineCell.winner || '?' }
                                        </div>
                                    )) ||
                                    null
                                }
                            </div>
                        }
                    </div>
                ))
            )}
        </div>
    );
}
