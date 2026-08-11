import { useEffect, useMemo, useState } from "react";
import { AuthContext } from "./authContext.js";
import {
  clearAuthToken,
  isRememberMeEnabled,
  setAuthToken,
} from "../utils/authStorage.js";
import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
} from "../services/authService.js";

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      const tokenExists = Boolean(
        window.sessionStorage.getItem("ems_access_token") ||
        window.localStorage.getItem("ems_access_token"),
      );

      if (!tokenExists) {
        if (isMounted) {
          setIsBootstrapping(false);
        }

        return;
      }

      try {
        const response = await getCurrentUser();

        if (isMounted) {
          setUser(response.user);
        }
      } catch {
        clearAuthToken();
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      }
    }

    bootstrap();

    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener("ems:unauthorized", handleUnauthorized);

    return () => {
      isMounted = false;
      window.removeEventListener("ems:unauthorized", handleUnauthorized);
    };
  }, []);

  async function login(payload) {
    const response = await loginRequest(payload);
    setAuthToken(response.token, Boolean(payload.rememberMe));
    setUser(response.user);
    return response;
  }

  async function register(payload) {
    const response = await registerRequest(payload);
    setAuthToken(response.token, true);
    setUser(response.user);
    return response;
  }

  async function logout() {
    try {
      await logoutRequest();
    } finally {
      clearAuthToken();
      setUser(null);
    }
  }

  function updateUser(updatedUser) {
    setUser(updatedUser);
  }

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isBootstrapping,
      login,
      register,
      logout,
      updateUser,
      rememberMeEnabled: isRememberMeEnabled(),
    }),
    [isBootstrapping, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthProvider };
