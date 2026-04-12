import type { DataConnection } from 'peerjs';
import { createContext, useContext, useState, type ReactNode } from 'react';

export interface User {
    conn: DataConnection;
    name: string;
}

export interface Party {
    role: 'leader' | 'member';
    members: User[];
}

interface PartyContextType {
    party: Party | null;
    setParty: (party: Party) => void;
}

// 2. Create the Context
const PartyContext = createContext<PartyContextType | undefined>(undefined);

// 3. Create a Provider component
export const PartyProvider = ({ children }: { children: ReactNode }) => {
    const [party, _setParty] = useState<Party | null>(null);
    const setParty = (party: Party) => {
        _setParty(party);
    }

    return (
        <PartyContext.Provider value={{ party, setParty }}>
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