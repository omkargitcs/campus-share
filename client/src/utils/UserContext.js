import { createContext, useContext } from "react";

export const UserContext = createContext({ user: null, verified: false });

// { user: { id, email, role }, verified } — verified = role has been confirmed by the server
export const useUser = () => useContext(UserContext);
