import { useQuery } from '@tanstack/react-query'
import { type DataConnection } from 'peerjs';
import { usePeer } from './getPeer';
import { useUser, type User } from './UserProvider';
import { useNavigate } from '@tanstack/react-router';
import { useGameStore } from './useDuelStore';


export type TPeerSend = { type: "Connection", data: User } | { type: "Accept", word: string } | { type: "Turn", data : { action : "submit" } | { action : "clear" } | { action : "backspace" } | { action : "type", char: string }};
export type TConnection = { user?: User, conn: DataConnection }

export const useConnection = (connectionId: string) => {
    const { data: peer } = usePeer();
    const { user } = useUser();
    const navigate = useNavigate();
    const setTargetWord = useGameStore((state) => state.setTargetWord);
    

    const connect = async () => {
        if (!peer) throw new Error("Peer is not initialized");
        if (!connectionId) throw new Error("No connection ID provided");
        
        const conn = peer.connect(connectionId);

        return new Promise<TConnection>((resolve, reject) => {
            const timeout = setTimeout(() => reject("Connection timeout"), 10000);

            conn.on('open', async () => {
                
                conn.send({
                    type: "Connection",
                    data: user
                });

                conn.on("data", (data) => {
                    const _data = data as TPeerSend;
                    if(_data.type === "Connection") {
                        clearTimeout(timeout);
                        resolve({ user: _data.data as User, conn });
                        return;
                    }
                    if(_data.type == "Accept") {
                        setTargetWord(_data.word);
                        navigate({to: '/dueldle/game'});
                    }
                });
                
            });

            conn.on('error', (err : any) => {
                clearTimeout(timeout);
                reject(err);
            });
        });
    };

    return useQuery<TConnection>({
        queryKey: ["conn"],
        queryFn: connect,
        enabled: false
    })
}