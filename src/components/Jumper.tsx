import styles from './Jumper.module.css';

export interface IJumperProps<T> {
    className ?: string;
    onJumperClick: (i : IJumperItem<T>) => void,
    items: IJumperItem<T>[],
    onJumperRender: (item: IJumperItem<T>) => React.ReactNode
}

export interface IJumperItem<T> {
    label: string;
    value: T;
}
export default function Jumper<T>(props : IJumperProps<T>) {
    return <div className={`${styles.Jumper} ${props.className || ''}`}>
        {
            props.items.map((item) => <div onClick={() => props.onJumperClick(item)}>{props.onJumperRender(item)}</div>)
        }
    </div>
}