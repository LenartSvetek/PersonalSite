import { usePeer } from '@api/getPeer'
import { useConnection, type TConnection, type TPeerSend } from '@api/useConnect';
import { useUser, type User } from '@api/UserProvider';
import { createFileRoute, useLocation, useNavigate } from '@tanstack/react-router'
import type { DataConnection } from 'peerjs';
import { useEffect, useState, type ChangeEvent } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import answerWords from '../../../answerWords.tsx';
import { useGameStore } from '@api/useDuelStore';


import styles from './index.module.css';

const searchSchema = z.object({
  connectTo: z.string().optional(),
})

export const Route = createFileRoute('/games/dueldle/')({
    component: Index,
    validateSearch: (search) => searchSchema.parse(search)
})

const MIN = 0;
const MAX = answerWords.size - 1;

function Index() {
    const setTargetWord = useGameStore((state) => state.setTargetWord);

    const queryClient = useQueryClient();
    const { connectTo } = Route.useSearch();

    const navigate = useNavigate();
    const location = useLocation();
    const fullUrl = `${window.location.origin}/#${location.pathname}`

    const { data: peer, isFetching, isError } = usePeer();
    const { user, setUser } = useUser();

    const [ peerId, setPeerId] = useState<string>(connectTo || '');
    const [ connections, setConnections ] = useState<Map<string, TConnection>>(new Map());
    const { data: conn, refetch } = useConnection(peerId);
    
    useEffect(() => {
        if (!peer) return;

        const handleConnection = (incomingConn: DataConnection) => {
            
            setConnections(prev => {
                const next = new Map(prev);
                next.set(incomingConn.connectionId, { user: undefined, conn: incomingConn });
                return next;
            });

            incomingConn.on("data", (data) => {
                const _data = data as TPeerSend;
                if (_data.type === "Connection") {
                    setConnections(prev => {
                        const next = new Map(prev);
                        const item = next.get(incomingConn.connectionId);
                        if (item) {
                            next.set(incomingConn.connectionId, { ...item, user: _data.data as User });
                        }
                        return next;
                    });
                    incomingConn.send({ type: "Connection", data: user });
                }
            });

            incomingConn.on("close", () => {
                setConnections(prev => {
                    const next = new Map(prev);
                    next.delete(incomingConn.connectionId);
                    return next;
                });
            });
        };

        peer.on("connection", handleConnection);
        
        return () => {
            peer.off("connection", handleConnection);
        };
    }, [peer, user]);


    useEffect(() => {
        if(!peerId || peerId.trim().length == 0) return;
        let url : URL;
        try {
            url = new URL(peerId);
        } catch (err) {
            return;
        }

        if(url.hash.trim().length == 0 || !url.hash.includes('?') || !url.hash.includes('connectTo=')) return;

        const params = new URLSearchParams(url.hash.split('?')[1]);
        setPeerId(params.get('connectTo') || '');
    }, [peerId])

    useEffect(() => {
        if (!conn?.conn) return;

        const handleClose = () => {
            queryClient.setQueryData(["conn"], null);
            setPeerId('');
        };

        conn.conn.on('close', handleClose);
        return () => {
            conn.conn.off('close', handleClose);
        };
    }, [conn, peerId, queryClient]);

    if(isFetching) return <div>getting connection</div>;
    if(isError) return <div>Something went wrong</div>;

    const acceptRequest = (conn : TConnection) => {
        queryClient.setQueryData(["conn"], conn);

        const wordI = Math.floor(Math.random() * (MAX - MIN + 1)) + MIN;
        const word = [...answerWords][wordI];
        conn.conn.send({
            type: 'Accept',
            word: word
        } as TPeerSend)

        setTargetWord(word);
        navigate({to: '/games/dueldle/game'});
    }

    return (
        <div className={styles.flexCenter}>
            <div className={styles.card}>
                <input onChange={(ev) => setUser({...user, name: ev.currentTarget.value})} value={user?.name}></input>
                {
                    peer &&
                    <h4 style={{cursor: 'pointer'}} onClick={() => navigator.clipboard.writeText(`${fullUrl}?connectTo=${peer.id}`)}>Your id: {peer && peer.id}</h4>
                }
                <div>
                    <input onChange={(ev : ChangeEvent<HTMLInputElement>) => setPeerId(ev.currentTarget.value)} value={peerId} type="text" placeholder='others id'></input>
                </div>
                <button onClick={() => { conn?.conn.close(); refetch(); }}>send request</button>
                <div>
                    <h5>Active connections:</h5>
                    {
                        [...connections].map((conn) => 
                            conn[1].user && 
                            <div>
                                {conn[1].user.name}
                                <button onClick={() => acceptRequest(conn[1])}>Accept</button>
                                <button onClick={() => conn[1].conn.close()}>Deny</button>
                            </div> 
                        || undefined)
                    }
                </div>

                {
                    peer &&
                    <div style={{ background: 'white', padding: '10px', display: 'inline-block', borderRadius: '4px', margin: '0 auto' }}>
                        <QRCodeCanvas 
                            value={`${fullUrl}?connectTo=${peer.id}`}       // The data encoded in the QR code
                            size={200}         // Size in pixels
                            bgColor={"#ffffff"} // Background color
                            fgColor={"#000000"} // Foreground color
                            level={"H"}         // Error correction level (L, M, Q, H) - H is highest
                            includeMargin={true}
                        />
                    </div>
                }
            </div>
        </div>
    )
}