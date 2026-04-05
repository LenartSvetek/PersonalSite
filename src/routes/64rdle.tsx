import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod';
// 1. Define your schema (Zod is recommended)
const wordleParamSchema = z.object({
    seed: z.number().optional(),
    mode: z.enum(["daily"]).default("daily")
});

const getFallbackSeed = () => {
    let date = new Date();
    let startDate = new Date('03/24/2022');
    let offset = (date.getTimezoneOffset() - startDate.getTimezoneOffset()) * 60000;
    let seed = (DATE_SEED + ((date.getTime() - offset - startDate.getTime()) / (1000 * 3600 * 24))) >> 0;
    return seed < 10 ? 10 : seed;
};

export const Route = createFileRoute('/64rdle')({
    component: Index,
    validateSearch: (search) => wordleParamSchema.parse(search),
    loaderDeps: ({search: { seed }}) => { return {seed}},
    loader: ({deps : { seed }}) => {
        return {
            seed: seed || getFallbackSeed()
        }
    }
})

import answerWords from '../answerWords';
import allWords from '../allWords';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useCallback, useEffect, useRef, useState } from 'react';

// @ts-ignore
import { MersenneTwister } from "fast-mersenne-twister";
import Keyboard from '@components/Keyboard';
import Jumper from '@components/Jumper';

const DATE_SEED = 123;

import './64rdle.css';

function Index() {
    const { mode } = Route.useSearch();
    const { seed } = Route.useLoaderData();

    const [words] = useState<string[]>(() => {
        let rnd = MersenneTwister(seed);


        for (let i = 0; i < 8; i++) { rnd.genrand_int31() }

        let answers = new Set<string>();
        const arrAnswers = [...answerWords];
        for (; answers.size < 64;) {
            let answer = arrAnswers[rnd.genrand_int31() % arrAnswers.length];
            answers.add(answer);
        }
        return [...answers]
    });
    const [word, setWord] = useState<string>('');
    const [history, setHistory] = useState<string[]>(() => localStorage.getItem(`${mode}_guesses_${seed}`)?.split(`,`).filter(word => word.length == 5) || []);
    const [closeGuesses, setCloseGuesses] = useState<Map<string, { [key: string]: "found" | "missplaced" | "wrong", together: number | any }>>(() => {
        let guesses = new Map();
        for (let answer of words) {
            let guess: { [key: string]: boolean | any, together: number } = { "0": "wrong", "1": "wrong", "2": "wrong", "3": "wrong", "4": "wrong", together: 0 };

            let charAns: { [key: string]: number } = {};
            for (let char of answer) {
                charAns[char] = charAns[char] && charAns[char] + 1 || 1;
            }

            for (let word of history) {
                let tmpCharAns = { ...charAns };

                let i = 0;
                for (let char of (word)) {
                    if (char === answer[i]) {
                        tmpCharAns[char] = tmpCharAns[char];
                    }
                    i++;
                }

                let tmpAns = answer;

                for (let i = 0; i < 5; i++) {
                    
                    if (guess[i] == "found") continue;

                    if (word[i] == tmpAns[i]) {
                        guess[i] = "found";
                        guess.together++;
                        tmpAns = tmpAns.replace(word[i], " ");
                        continue;
                    }
                    if (tmpCharAns[word[i]] > 0) {
                        tmpCharAns[word[i]]--;
                        let missI = answer.indexOf(word[i]);
                        if(guess[missI] != "found")
                            guess[missI] = "missplaced";
                        continue;
                    }
                }
            }
            guesses.set(answer, guess);
        }
        return guesses;
    });
    const [validIndex, setValidIndex] = useState<number>(0);
    const [validGuesses, setValidGuesses] = useState<Set<string>>(() => {
        let validGuesses = new Set<string>();
        for(let word of history) {
            if(words.includes(word)) validGuesses.add(word);
        }

        return validGuesses;
    });

    const gameFinished = history.length >= 70 || validGuesses.size == 64;
    const [ showEndScreen, setShowEndScreen] = useState<boolean>(gameFinished);

    const parentRef = useRef(null);

    const rowVirtualizer = useVirtualizer({
        count: 8,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 2361
    });

    const submitWord = () => {
        if (word.length != 5) return;
        if (!allWords.has(word)) {
            setWord("");
            return;
        }
        let foundIndex = words.indexOf(word);

        if (foundIndex != -1) {
            let newSet = new Set(validGuesses);
            newSet.add(word);
            setValidGuesses(newSet);
            setValidIndex(foundIndex);
        }

        let guesses = new Map(closeGuesses);
        for (let answer of words) {
            let guess = guesses.get(answer);
            if (!guess) continue;
            
            let charAns: { [key: string]: number } = {};
            for (let char of answer) {
                charAns[char] = charAns[char] && charAns[char] + 1 || 1;
            }

            let i = 0;
            for (let char of (word)) {
                if (char === answer[i]) {
                    charAns[char] = charAns[char];
                }
                i++;
            }

            let tmpAns = answer;
            for (let i = 0; i < 5; i++) {
                if (guess[i] == "found") continue;

                if (word[i] == tmpAns[i]) {
                    guess[i] = "found";
                    guess.together++;
                    tmpAns = tmpAns.replace(word[i], " ");
                    continue;
                }
                if (charAns[word[i]] > 0) {
                    charAns[word[i]]--;
                    let missI = answer.indexOf(word[i]);
                        if(guess[missI] != "found")
                            guess[missI] = "missplaced";
                    continue;
                }
            }
        }
        setCloseGuesses(guesses);


        setHistory([...history, word]);
        setWord("");
    }

    const onWinKeyUp = useCallback((ev: KeyboardEvent) => {
        let key = ev.key.toLowerCase();

        if (key === "enter") {
            // We use a "no-op" state update to grab the current value
            setWord(current => {
                submitWord();
                return current;
            });
            return;
        }

        if (key === "backspace") {
            setWord(prev => prev.slice(0, -1));
            return;
        }

        if (key.length === 1 && key.charCodeAt(0) >= 97 && key.charCodeAt(0) <= 122) {
            setWord(prev => (prev.length >= 5 ? prev : prev + key));
        }
    }, [submitWord]); // Only changes if submitWord changes

    useEffect(() => {
        if(!gameFinished)
            window.addEventListener('keyup', onWinKeyUp);
        return () => window.removeEventListener('keyup', onWinKeyUp);
    }, [onWinKeyUp]);

    useEffect(()=> {
        if(gameFinished) {
            setShowEndScreen(true);
            window.removeEventListener('keyup', onWinKeyUp);
        }
    }, [gameFinished]);

    useEffect(() => {
        rowVirtualizer.scrollToIndex(Math.floor(validIndex / 8), { align: 'start', behavior: 'smooth' });
    }, [validIndex])

    useEffect(() => {
        localStorage.setItem(`${mode}_guesses_${seed}`, history.join(`,`));
    }, [history])



    // const columnVirtualizer = useVirtualizer({
    //     horizontal: true,
    //     count: 8,
    //     getScrollElement: () => parentRef.current,
    //     estimateSize: () => 216
    // })





    return (
        <main>
            {/* <input value={word} onChange={(ev) => { ev.preventDefault(); setWord(ev.currentTarget.value.toLowerCase()) }} onKeyUp={(ev) => { ev.preventDefault(); if (ev.key == "Enter") submitWord() }} maxLength={5} /> */}
            <div className='titleRow'>
                <h3>64rdle cuz why not</h3>
                <div>
                    <h5>{history.length}/70 guesses</h5>
                    <h5>{validGuesses.size}/64 guesses</h5>
                </div>
            </div>
            {
                gameFinished && <button onClick={() => setShowEndScreen(true)}>show results</button>
            }
            <Jumper<number> 
                className="jumper"
                onJumperClick={(item) => rowVirtualizer.scrollToIndex(item.value, { align: 'start', behavior: 'smooth' })} 
                items={[ 
                    {
                        label: "1 - 8",
                        value: 0
                    },
                    {
                        label: "9 - 16",
                        value: 1
                    },
                    {
                        label: "17 - 24",
                        value: 2
                    },
                    {
                        label: "25 - 32",
                        value: 3
                    },
                    {
                        label: "33 - 40",
                        value: 4
                    },
                    {
                        label: "41 - 48",
                        value: 5
                    },
                    {
                        label: "49 - 56",
                        value: 6
                    },
                    {
                        label: "57 - 64",
                        value: 7
                    }
            ]}
                onJumperRender={(item) => {
                    return <>
                    <div className='item'>
                        <h4>{item.label}</h4>
                        <div className='state'>
                            {
                                words.slice(item.value * 8, (item.value + 1) * 8).map((word) => {
                                    return <div className={`${validGuesses.has(word) && `completed` || closeGuesses.get(word)?.together == 5 && `missplaced` || ``}`}></div>
                                })
                            }
                        </div>
                    </div>
                    </>
                }}
            ></Jumper>
            <div
                ref={parentRef}
                className='game'
                style={{
                    width: '100%',
                    overflow: 'auto'
                }}
            >
                <div
                    style={{
                        height: `${rowVirtualizer.getTotalSize()}px`,
                        width: `100%`,
                        position: 'relative',
                    }}
                >
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => (
                        <div
                            key={virtualRow.key}
                            data-index={virtualRow.index}
                            id={`tableRow_${virtualRow.key}`}
                            className={`tableRow ${virtualRow.index == 0 && `first` || ``}`}
                            ref={rowVirtualizer.measureElement}
                            style={{
                                display: 'inline-flex',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: `100%`,
                                transform: `translateY(${virtualRow.start || 0}px)`,
                            }}
                        >
                            {[0, 1, 2, 3, 4, 5, 6, 7].map((virtualColumn) => {
                                let index = (virtualRow.key as number) * 8 + virtualColumn;
                                if (index >= words.length) return;
                                const gameWord = words[index];
                                const guess = closeGuesses.get(gameWord) || { together: 0 };
                                let charGW: { [key: string]: number } = {};
                                for (let char of gameWord) {
                                    charGW[char] = charGW[char] && charGW[char] + 1 || 1;
                                }


                                let missingChar: string | undefined = undefined;
                                if (guess.together == 4) {
                                    for (let i = 0; i < 5; i++) {
                                        // @ts-ignore
                                        if (guess[i] != "found") {
                                            missingChar = gameWord[i];
                                            break;
                                        }
                                    }
                                }

                                return (
                                    <div
                                        key={virtualColumn}
                                        className={`table ${validGuesses.has(gameWord) && `completed` || ``}`}
                                    >
                                        <h3>{index + 1}</h3>
                                        <div className='progressBar'>
                                            {(() => {
                                                let rows : any[] = [];

                                                for(let i = 0; i < 5; i++) rows.push(<div className={`${i < guess.together && `green` || ``}`}></div>);

                                                return rows;
                                            })()}
                                        </div>
                                        <div className='tab'>
                                            {(() => {
                                                let rows = [];
                                                let tmpWord = "";

                                                for (let i = 0; i < 70; i++) {
                                                    if (i < history.length) {
                                                        tmpWord = history[i];

                                                        let tmpCharGW = { ...charGW };
                                                        for (let j = 0; j < 5; j++) {
                                                            let char = tmpWord[j];
                                                            if (gameWord[j] === char) {
                                                                let num = (tmpCharGW[char] || 0) - 1;
                                                                tmpCharGW[char] = num;
                                                            }
                                                        }
                                                        
                                                        rows.push(
                                                            [...tmpWord].map((char, k) => {
                                                                let className = ``;
                                                                if (char === gameWord[k]) className = guess.together < 4 && 'correct' || missingChar == char && 'repeats' || 'correct';
                                                                else if (gameWord.indexOf(char) >= 0 && tmpCharGW[char] > 0) {
                                                                    className = guess.together < 4 && 'wrong-place' || missingChar == char && 'wrong-place-last' || 'wrong-place';
                                                                    tmpCharGW[char]--;
                                                                }
                                                                return <div className={`${className}`}>{char}</div>;
                                                            })
                                                        );

                                                        if (tmpWord == gameWord) break;
                                                    }
                                                    else if (i == history.length) {
                                                        tmpWord = word;
                                                        rows.push(
                                                            <>
                                                                <div className='open'>{tmpWord[0]}</div>
                                                                <div className='open'>{tmpWord[1]}</div>
                                                                <div className='open'>{tmpWord[2]}</div>
                                                                <div className='open'>{tmpWord[3]}</div>
                                                                <div className='open'>{tmpWord[4]}</div>
                                                            </>
                                                        );
                                                    }
                                                    else {
                                                        rows.push(
                                                            <>
                                                                <div></div>
                                                                <div></div>
                                                                <div></div>
                                                                <div></div>
                                                                <div></div>
                                                            </>
                                                        );
                                                    }
                                                }

                                                return rows;
                                            })()}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ))}
                </div>
            </div>
            <div className='toolbar'>
                <div style={{height: '120px'}}>
                    <Keyboard
                        disabled={gameFinished}
                        wordState={closeGuesses}
                        onKeyClick={(char) => {
                            if (word.length > 4) return;
                            setWord(word + char);
                        }}
                        onBackspace={() => {
                            setWord(word.substring(0, word.length - 1));
                        }}
                        onEnter={() => submitWord()}></Keyboard>
                </div>
            </div>
            <div className={`modal ${!showEndScreen && `hidden` || ``}`}>
                <button onClick={() => setShowEndScreen(false)}>close</button>
                Yooo wooon
            </div>
        </main>
    )
}