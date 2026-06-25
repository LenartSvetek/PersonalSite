import { useParty } from "@api/PartyProvider";
import { useEffect, useRef, useState } from "react";

import styles from './Party.module.css';
import { useUser } from "@api/UserProvider";



export function Party() {
    const { user, setUsername} = useUser();
    const { party, createParty, stage, joinParty, incomingRequst, acceptRequest, refuseRequest, getPartyId, leaveParty } = useParty();
    const [ isOpen, setOpen ] = useState(false);
    

    const partyIdInputRef = useRef<HTMLInputElement>(null);

    // useEffect(() => {
    //     const fetchPartyData = async () => {
    //         try {
    //         await createParty();
    //         } catch (error) {
    //         console.error("Failed to create party:", error);
    //         }
    //     };

    //     // 2. Call it
    //     fetchPartyData();
    // }, []);

    // useEffect(() => {
    //     if(party) setStage('Party');
    //     else setStage('NoParty');
    // }, [party]);

    const CreateParty = async (ev : React.MouseEvent<HTMLButtonElement>) => {
        await createParty();
    }

    const JoinParty = async (ev : React.MouseEvent<HTMLButtonElement>) => {
        if(stage == 'NoParty') {
            joinParty();
            return;
        }
        if(!partyIdInputRef.current) return;
        let id = partyIdInputRef.current.value;

        joinParty(id);
    };

    return <>
        <div className={`${styles.PartyButton} ${isOpen && styles.openParty || ''}`} onClick={() => setOpen(!isOpen)}></div>
        {
            isOpen &&
            <div className={styles.PartyContainer} onClick={() => setOpen(false)}>
                <div className={styles.PartyBox} onClick={ev => ev.stopPropagation()}>
                    <input type="text" value={user.name} onChange={(ev) => setUsername(ev.currentTarget.value)}></input>
                    {
                        stage == 'NoParty' &&
                        <>
                            <button type="button" onClick={CreateParty}>Create party</button>
                            <button type="button" onClick={JoinParty}>Join party</button>
                        </> ||
                        stage == 'JoiningParty' &&
                        <>
                            <input placeholder="party id" ref={partyIdInputRef}></input>
                            <button type="button" onClick={JoinParty}>Join party</button>
                        </> ||
                        stage == 'Party' &&
                        <>
                            <div>Party id: <br></br>{party?.role == 'leader' && getPartyId() || party?.leader?.user.name || ""}</div>
                            <button type="button" onClick={leaveParty}>leave party</button>
                            <div>Party memebers:</div>
                            {
                                party?.role == 'member' &&
                                <div>
                                    <span>{party.leader?.user.name}</span>
                                </div>
                            }
                            {
                                party?.members.map(m => <>
                                    <div>
                                        <span>{m.user.name}</span>
                                    </div>
                                </>)
                            }
                            <div></div>
                            {
                                party?.role == "leader" &&
                                <>
                                    <div>Party join requests:</div>
                                    <div>
                                        {
                                            incomingRequst.map((req) => <>
                                            <div>
                                                <span>{req.user.name}</span>
                                                <button type="button" onClick={() => acceptRequest(req)}>accept</button>
                                                <button type="button" onClick={() => refuseRequest(req)}>refuse</button>
                                            </div>
                                            </>)
                                        }
                                    </div>
                                </>
                            }
                        </>
                    }
                </div>
            </div>
        }
    </>

}