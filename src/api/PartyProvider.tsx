import { type DataConnection, Peer } from 'peerjs';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useUser, type User } from './UserProvider';
import { usePeer } from './getPeer';

export type TPeerSend = { type: "Request", data: User } | { type: "Accept", data: any } | { type: 'Refuse', data: any } | { type: 'Data', data: any } | { type: 'Joined', data: ConnUser[]} | { type: 'Left', data: ConnUser[]};
export type TConnection = { user?: ConnUser, conn: DataConnection } | null;

export interface ConnUser {
    conn?: DataConnection;
    user: User;
}

export interface PeerUser {
    user: User;
}

export interface Party {
    role: 'leader' | 'member';
    me: PeerUser;
    leader: ConnUser | null;
    members: ConnUser[];
}

export type TPartyStage = 'Initializing' | 'NoParty' | 'CreatingParty' | 'JoiningParty' | 'WaitingForRequestReply' | 'Party';

interface PartyContextType {
    party: Party | null;
    stage: TPartyStage;
    incomingRequst: ConnUser[];
    getPartyId: () => string;
    setParty: (party: Party) => void;
    createParty: () => Promise<void>;
    refuseRequest: (user: ConnUser) => Promise<void>;
    acceptRequest: (user: ConnUser) => Promise<void>;
    joinParty: (partyId?: string) => Promise<void>;
}


// 2. Create the Context
const PartyContext = createContext<PartyContextType | undefined>(undefined);

// 3. Create a Provider component
export const PartyProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useUser();
    const { data: peer } = usePeer();
    const [party, _setParty] = useState<Party | null>(null);
    const [stage, setStage] = useState<TPartyStage>('Initializing');
    const [conn, setConn] = useState<DataConnection | null>(null);
    const [incomingConn, setIncommingConn] = useState<Map<string, ConnUser>>(new Map());

    useEffect(() => {
        if(peer) setStage('NoParty');
    }, [peer]);

    const setParty = (party: Party) => {
        _setParty(party);
    }

    const handleConnection = (conn : DataConnection) => {
        conn.on('data', (data) => {
            let _data = data as TPeerSend;

            switch(_data.type) {
                case 'Request': 
                    let tmpCons = new Map(incomingConn);
                    if(tmpCons.has(_data.data.id)) tmpCons.delete(_data.data.id);
                    tmpCons.set(_data.data.id, { user: _data.data, conn });
                    setIncommingConn(tmpCons);
                    break;
            }
        })
    }

    const refuseRequest = async (user : ConnUser) => {
        if(!user.conn) return;
        let tmpConn = new Map(incomingConn);
        tmpConn.delete(user.user.id);
        setIncommingConn(tmpConn);

        await user.conn.send({
            type: 'Refuse'
        } as TPeerSend);

        user.conn.close();
    }

    const acceptRequest = async (user : ConnUser) => {
        if(!user.conn) return;
        console.log(user);
        if(!party) return;
        let tmpConn = new Map(incomingConn);
        tmpConn.delete(user.user.id);
        setIncommingConn(tmpConn);

        console.log('sending user joining');
        for(let member of party?.members) {
            if(!member.conn) continue;
            member.conn.send({
                type: 'Joined',
                data: [ { user: user.user } ]
            } as TPeerSend);
        }

        console.log('sending data',{
            type: 'Accept',
            data: {
                role: 'member',
                leader: { user: party.me.user },
                members: party?.members.map(m => { return { user: m.user } })
            } as Party
        });
        await user.conn.send({
            type: 'Accept',
            data: {
                role: 'member',
                leader: { user: party.me.user },
                members: party?.members.map(m => { return { user: m.user } })
            } as Party
        } as TPeerSend);

        console.log("strtingifz", party);
        let tmpParty = JSON.parse(JSON.stringify(party)) as Party;
        console.log("it stringigfied");
        tmpParty.members.push(user);
        setParty(tmpParty);
        console.log("it stringigfied saved");
    }

    const createParty = async () => {
        if(!peer) return;

        let party: Party = {
            role: 'leader',
            me: {
                user: user
            },
            leader: null,
            members: []
        };

        peer.on('connection', handleConnection);

        setStage('Party');
        setParty(party);
    }

    const joinParty = async (partyId: string = "") => {
        if (stage == 'NoParty') {
            setStage('JoiningParty');
            return;
        }
        console.log("starting to join");

        var peer = new Peer();

        await new Promise<Peer>((resolve, reject) => {
            peer.on('open', () => resolve(peer));
            peer.on('error', (err) => reject(err));
        });

        const connect = async (peer: Peer, partyId: string) => {
            if (!peer) throw new Error("Peer is not initialized");
            if (!partyId) throw new Error("No party ID provided");

            const conn = peer.connect(partyId);


            const timeout = setTimeout(() => {
                console.log("Connection requst timeout");
                conn.close();
            }, 10000);

            conn.on('open', async () => {
                conn.send({
                    type: 'Request',
                    data: user
                } as TPeerSend);

                conn.on("data", (data) => {
                    const _data = data as TPeerSend;

                    if (_data.type == 'Refuse') {
                        conn.close();
                        clearTimeout(timeout);
                        setStage('NoParty');
                        return;
                    }
                    if (_data.type == "Accept") {
                        clearTimeout(timeout);
                        setParty(_data.data);
                        setStage('Party');
                        return;
                    }
                });

            });

            conn.on('error', (err: any) => {
                clearTimeout(timeout);
            });

            return conn;
        };

        let conn = await connect(peer, partyId);
        setStage('WaitingForRequestReply');
    };

    const getPartyId = () => peer?.id || '';

    return (
        <PartyContext.Provider value={{ party, setParty, createParty, joinParty, stage, incomingRequst: [...incomingConn].map(conn => conn[1]), refuseRequest, acceptRequest, getPartyId }}>
            {children}
        </PartyContext.Provider>
    );
};

// 4. Create a custom hook for easy access
export const useParty = () => {
    const context = useContext(PartyContext);
    if (!context) throw new Error("useParty must be used within a PartyProvider");
    return context;
};