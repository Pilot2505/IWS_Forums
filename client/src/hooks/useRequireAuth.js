import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function useRequireAuth({
  redirectTo = "/login",
  authenticatedTo = null,
  requireToken = false,
} = {}) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (!storedUser || (requireToken && !storedToken)) {
      navigate(redirectTo, { replace: true });
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    setReady(true);

    if (authenticatedTo) {
      navigate(authenticatedTo, { replace: true });
    }
  }, [navigate, redirectTo, authenticatedTo, requireToken]);

  return { user, setUser, ready };
}