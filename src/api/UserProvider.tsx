import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

// 1. Define the shape of your user
export interface User {
    id: `${string}-${string}-${string}-${string}-${string}`;
    name: string;
}

interface UserContextType {
    user: User;
    setUser: (user: User) => void;
    setUsername: (name: string) => void;
}

// 2. Create the Context
const UserContext = createContext<UserContextType | undefined>(undefined);

// 3. Create a Provider component
export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, _setUser] = useState<User>(localStorage.getItem('user') && JSON.parse(localStorage.getItem('user') || '') || {id: crypto.randomUUID(), name: "Demo"});
    const setUser = (user: User) => {
        localStorage.setItem('user', JSON.stringify(user));
        _setUser({...user});
    }

    const setUsername = (username: string) => {
        let newUser = {...user};
        newUser.name = username;
        console.log(newUser, username);
        setUser(newUser);
    };

    useEffect(() => {
        if(!user.id || user.id.trim() == '') {
            user.id = crypto.randomUUID();
            setUser(user);
        }
    }, []);

    return (
        <UserContext.Provider value={{ user, setUser, setUsername }}>
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