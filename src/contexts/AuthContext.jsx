import { createContext, useContext, useEffect, useState } from "react";
import { login as loginRequest, fetchCurrentUser, restoreSession, logout as logoutRequest } from "../services/authService";
import { connectSocket, disconnectSocket } from "../services/socket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = restoreSession();
    if (!token) {
      setLoading(false);
      return;
    }
    fetchCurrentUser()
      .then((u) => {
        setUser(u);
        connectSocket();
      })
      .catch(() => logoutRequest())
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    setError("");
    try {
      const u = await loginRequest(email, password);
      setUser(u);
      connectSocket();
    } catch (e) {
      setError(e.message || "Não foi possível entrar");
      throw e;
    }
  };

  const logout = () => {
    logoutRequest();
    disconnectSocket();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
