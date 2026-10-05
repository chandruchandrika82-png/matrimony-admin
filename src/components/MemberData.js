import { createContext, useCallback, useContext, useEffect, useState } from "react";
import api from "../services/api";
const Context = createContext(null);
export function MemberProvider({ children }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const { data } = await api.get("/users");
      const rows = Array.isArray(data) ? data : data.users || data.data;
      if (!Array.isArray(rows)) throw new Error("Invalid member response");
      setMembers(rows);
    } catch (err) {
      setError([401, 403].includes(err.response?.status) ? "Your session cannot access members. Sign out and sign in again." : "Unable to load members. Check your connection and try again.");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  return <Context.Provider value={{ members, loading, error, refresh }}>{children}</Context.Provider>;
}
export const useMembers = () => useContext(Context);
export function DataNotice() {
  const { loading, error, refresh } = useMembers();
  if (loading) return <div className="notice" role="status">Loading member records...</div>;
  return error ? <div className="notice error" role="alert">{error}<button className="button" onClick={refresh}>Try again</button></div> : null;
}
