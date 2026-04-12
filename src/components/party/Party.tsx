import { useParty } from "@api/PartyProvider";
import { useState } from "react";

import styles from './Party.module.css';

export function Party() {
    const party = useParty();
    const [ isOpen, setOpen ] = useState(false);

    return <>
        <div className={styles.PartyButton}></div>
    </>

}