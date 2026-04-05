import { useConnection, type TPeerSend } from '@api/useConnect';
import { createFileRoute } from '@tanstack/react-router'

import styles from './game.module.css'
import { useCallback, useEffect, useMemo, useState } from 'react';

// import answerWords from './answerWords.tsx';
import allWords from '../../allWords.tsx';
import { useUser, type User } from '@api/UserProvider.tsx';
import Keyboard from '@components/Keyboard.tsx';
import { useGameStore } from '@api/useDuelStore.tsx';

export const Route = createFileRoute('/dueldle/game')({
    component: RouteComponent,
});

interface IGame {
    guess: string;
    history: string[];
}

function RouteComponent() {
    const { user } = useUser();
    const { data: conn } = useConnection('');

    const [playerGame, setPlayerGame] = useState<IGame>({ guess: '', history: [] });
    const [opponentGame, setOpponentGame] = useState<IGame>({ guess: '', history: [] });

    const todaysWord = useGameStore((state) => state.targetWord);
    const gameFinished = useMemo(() => playerGame.history.length >= 6 && opponentGame.history.length >= 6 || playerGame.history.length > 0 && playerGame.history[playerGame.history.length - 1] == todaysWord || opponentGame.history.length > 0 && opponentGame.history[opponentGame.history.length - 1] == todaysWord, [playerGame, opponentGame]);

    useEffect(() => {
        const activeConn = conn?.conn;
        if (!activeConn || !activeConn.open) return;

        const handleTurns = (_data: unknown) => {
            const data = _data as TPeerSend;
            if (data.type == "Turn") {
                const turn = data.data;

                setOpponentGame(prev => {
                    if (turn.action === 'submit') {
                        return { ...prev, history: [...prev.history, prev.guess], guess: '' };
                    }
                    if (turn.action === 'backspace') {
                        return { ...prev, guess: prev.guess.slice(0, -1) };
                    }
                    if (turn.action === 'clear') {
                        return { ...prev, guess: '' };
                    }
                    if (turn.action === 'type') {
                        const key = turn.char;
                        return {
                            ...prev,
                            guess: prev.guess.length >= 5 ? prev.guess : prev.guess + key
                        };
                    }
                    return prev;
                });
            }
        }

        conn?.conn.on('data', handleTurns);

        return () => {
            conn?.conn.off('data', handleTurns);
        };
    }, [conn?.conn]);

    const submitWord = useCallback(() => {
        if (playerGame.guess.length !== 5) return;
        if (!allWords.has(playerGame.guess)) {
            conn?.conn.send({
                type: 'Turn',
                data: { action: 'clear' }
            } as TPeerSend);
        } else {
            conn?.conn.send({
                type: 'Turn',
                data: { action: 'submit' }
            } as TPeerSend);
        }

        setPlayerGame(prev => {
            if (prev.guess.length !== 5) return prev;
            if (!allWords.has(prev.guess)) {
                return { ...prev, guess: '' };
            }

            return {
                ...prev,
                history: [...prev.history, prev.guess],
                guess: ''
            };
        });
    }, [conn, playerGame]);

    const onWinKeyUp = useCallback((ev: KeyboardEvent) => {
        ev.preventDefault();

        let key = ev.key.toLowerCase();


        if (key === "enter") {
            submitWord();
            return;
        }

        if (key === "backspace") {
            if (playerGame.guess.length == 0) return;

            conn?.conn.send({
                type: 'Turn',
                data: { action: 'backspace' }
            } as TPeerSend);

            setPlayerGame(prev => {
                const guess = prev.guess.slice(0, -1);

                return { ...prev, guess }
            });

            return;
        }

        if (key.length === 1 && key.charCodeAt(0) >= 97 && key.charCodeAt(0) <= 122) {
            if (playerGame.guess.length >= 5) return;

            conn?.conn.send({
                type: 'Turn',
                data: { action: 'type', char: key }
            } as TPeerSend);

            setPlayerGame(prev => {
                const guess = prev.guess.length >= 5 && prev.guess || prev.guess + key

                return { ...prev, guess }
            });
        }
    }, [submitWord, playerGame]);

    useEffect(() => {
        if (!gameFinished)
            window.addEventListener('keyup', onWinKeyUp);
        return () => window.removeEventListener('keyup', onWinKeyUp);
    }, [onWinKeyUp]);

    useEffect(() => {
        if (gameFinished) {
            window.removeEventListener('keyup', onWinKeyUp);
        }
    }, [gameFinished]);

    return <>
        <div>
            <div className={styles.board}>
                {
                    renderGame(todaysWord, user, playerGame)
                }
                {
                    renderGame(todaysWord, conn?.user, opponentGame, true)
                }
            </div>
            {
                !gameFinished &&
                <div className={styles.keyboardcontainer}>
                    <Keyboard
                        onKeyClick={(char) => {
                            if (playerGame.guess.length > 4) return;
                            conn?.conn.send({
                                type: 'Turn',
                                data: { action: 'type', char: char }
                            } as TPeerSend);

                            setPlayerGame(prev => {
                                const guess = prev.guess.length >= 5 && prev.guess || prev.guess + char

                                return { ...prev, guess }
                            });
                        }}
                        onBackspace={() => {
                            if (playerGame.guess.length == 0) return;

                            conn?.conn.send({
                                type: 'Turn',
                                data: { action: 'backspace' }
                            } as TPeerSend);

                            setPlayerGame(prev => {
                                const guess = prev.guess.slice(0, -1);

                                return { ...prev, guess }
                            });
                        }}
                        onEnter={() => submitWord()}
                    ></Keyboard>
                </div> ||
                <div className={styles.endGameCont}>
                    {
                        playerGame.history[playerGame.history.length - 1] == todaysWord && <h2>Congratulations you won!</h2> || <h2>Sorry you lost!</h2>
                    }
                </div>
            }
        </div>
    </>;
}


function renderGame(gameWord: string, user: User | undefined | null, game: IGame, opponent ?: boolean) {

    let gameWordCC: { [key: string]: number } = {}; // todays character counter
    for (let char of gameWord) {
        gameWordCC[char] = gameWordCC[char] && gameWordCC[char] + 1 || 1;
    }

    return <>
        <div>
            <h2>{user?.name || 'Gone away'}</h2>
            <div className={styles.game}>
                {
                    [0, 1, 2, 3, 4, 5].map((i) => {

                        let tmpWord;
                        if (i < game.history.length) {
                            tmpWord = game.history[i];

                            let tmpTodaysCC = { ...gameWordCC };
                            for (let j = 0; j < 5; j++) {
                                let char = tmpWord[j];
                                if (gameWord[j] === char) {
                                    let num = (tmpTodaysCC[char] || 0) - 1;
                                    tmpTodaysCC[char] = num;
                                }
                            }

                            return [...tmpWord].map((char, j) => {
                                let className = opponent && styles.filled || '';
                                if (char === gameWord[j]) className = styles.correct;
                                else if (gameWord.indexOf(char) >= 0 && tmpTodaysCC[char] > 0) className = styles.missplaced

                                return <div className={className}>{!opponent && char || ' '}</div>;
                            });
                        }
                        else if (i == game.history.length) {
                            tmpWord = game.guess;
                            return [...tmpWord, null, null, null, null, null].map((char, j) => {
                                if (j >= 5) return;
                                if (!char) return <div></div>;

                                return <div className={opponent && styles.filled || ''}>{!opponent && char || ' '}</div>;
                            })
                        }
                        return <>
                            <div></div>
                            <div></div>
                            <div></div>
                            <div></div>
                            <div></div>
                        </>;
                    })
                }
            </div>
        </div>
    </>;
}