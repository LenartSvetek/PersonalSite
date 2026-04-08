import { useEffect, useState } from 'react';
import styles from './Keyboard.module.css';

export type IKeyboardProps = {
    disabled ?: boolean;
    onKeyClick: (char: string) => void;
    onBackspace: () => void;
    onEnter: () => void;
} & (IDueldleProps | I64rdleProps)

export interface IDueldleProps {
    mode: 'dueldle';
    keyState: { [key: string]: 'found' | 'missplaced' | 'wrong' | 'unknown' };
}

export interface I64rdleProps {
    mode: '64rdle';
    wordState: Map<string, { [key: string]: "found" | "missplaced" | "wrong", together: number | any }>;
}

export default function Keyboard(props : IKeyboardProps) {
    const { disabled, mode } = props;

    const [ keys, setKeys ] = useState<Map<string, Map<number, "found" | "missplaced" | "wrong">>>(new Map());

    if(props.mode == '64rdle')
        useEffect(() => {
            if(mode != '64rdle' || !props.wordState) return;
            const wordState = props.wordState;

            let keys = new Map<string, Map<number, "found" | "missplaced" | "wrong">>();
            let wordI = 0;
            for(let keyState of wordState) {
                let [ key, state ] = keyState;
                let set : Map<number, "found" | "missplaced" | "wrong">;
                for(let i = 0; i < 5; i++) {
                    set = keys.has(key[i]) && keys.get(key[i]) || new Map<number, "found" | "missplaced" | "wrong">();
                    if(!set.has(wordI) || set.get(wordI) != "found")
                        set.set(wordI, state[i]);

                    keys.set(key[i], set);
                }

            wordI++;

            setKeys(keys);

            }
        }, [props.wordState]);

    const keyboardKeys = [..."qwertyuiopasdfghjkl","=","-",..."zxcvbnm","-"];
    return <>
        <div className={styles.keyboard}>
            {
                mode == '64rdle' &&
                keyboardKeys.map((key) => {
                    let positions : Map<number, "found" | "missplaced" | "wrong"> = keys.has(key) && keys.get(key) || new Map();
                    
                    let backgroundPattern = ``;
                    let tmpGradients = [];
                    let tmpHolding = [];
                    for(let i = 0; i < 64; i++) {
                        const state = positions.has(i) && positions.get(i) || "wrong";


                        const color = state == "found" && "green" || state == "missplaced" && "orange" || "white";
                        tmpHolding.push(`${color} ${(i % 8) * 12.5}% ${((i % 8) + 1) * 12.5}%`);
                        if((i + 1) % 8 == 0) {
                            tmpGradients.push(`linear-gradient(90deg, ${tmpHolding.join(',')})`);
                            tmpHolding = [];
                        }
                    }

                    backgroundPattern = tmpGradients.join(',');

                    let backgroundPosition = `left 0%, left 14.28%, left 28.57%, left 42.85%, left 57.14%, left 71.42%, left 85.71%, left 100%`;
                    let backgroundSize = `100% 12.5%`;


                    return <>
                    <div className={`${key == "=" && styles.enter || ''}`} >
                        <button 
                            disabled={disabled}
                            onClick={key == "=" && (() => props.onEnter()) || key == "-" && (() => props.onBackspace()) || (() => props.onKeyClick(key))}
                            style={{
                                backgroundImage: backgroundPattern,
                                backgroundPosition: backgroundPosition,
                                backgroundSize: backgroundSize
                            }}
                        >{key}</button>
                    </div>
                    </>
                }) ||
                mode == 'dueldle' &&
                keyboardKeys.map((key) => {
                    const keyState = props.keyState[key];
                    
                    let className = '';
                    switch(keyState) {
                        case 'found':
                            className = styles.found;
                            break;
                        case 'missplaced':
                            className = styles.missplaced;
                            break;
                        case 'wrong':
                            className = styles.wrong;
                    }

                    return <>
                    <div className={`${key == "=" && styles.enter || ''}`} >
                        <button 
                            disabled={disabled}
                            onClick={key == "=" && (() => props.onEnter()) || key == "-" && (() => props.onBackspace()) || (() => props.onKeyClick(key))}
                            className={className}
                        >{key}</button>
                    </div>
                    </>
                })
            }
        </div>
    </>;
}