import { createContext, useContext, useState, type ReactNode } from 'react';

// 1. Define the shape of your user
export interface User {
    name: string;
}

interface UserContextType {
    user: User | null;
    setUser: (user: User) => void;
}

// 2. Create the Context
const UserContext = createContext<UserContextType | undefined>(undefined);

// 3. Create a Provider component
export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, _setUser] = useState<User | null>(localStorage.getItem('user') && JSON.parse(localStorage.getItem('user') || '') || {name: "Demo"});
    const setUser = (user: User) => {
        localStorage.setItem('user', JSON.stringify(user));
        _setUser(user);
    }

    return (
        <UserContext.Provider value={{ user, setUser }}>
            {children}
        </UserContext.Provider>
    );
};

// 4. Create a custom hook for easy access
export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error("useUser must be used within a UserProvider");
    return context;
};