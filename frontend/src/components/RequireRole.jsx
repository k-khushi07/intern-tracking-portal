import React from "react";
import { Navigate, useLocation } from "react-router-dom";

import { authApi } from "../lib/apiClient";

const DASHBOARD_BY_ROLE = {
  intern: "/intern/dashboard",
  hr: "/hr/dashboard",
  pm: "/pm/dashboard",
  admin: "/admin/dashboard",
};

const LOGIN_BY_ROLE = {
  intern: "/intern/login",
  hr: "/hr/login",
  pm: "/pm/login",
  admin: "/admin/login",
};

export default function RequireRole({ role, children }) {
  const expectedRole = String(role || "").trim().toLowerCase();
  const location = useLocation();
  const [state, setState] = React.useState({ loading: true, profile: null, error: null });

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authApi.me();
        if (cancelled) return;
        setState({ loading: false, profile: res?.profile || null, error: null });
      } catch (err) {
        if (cancelled) return;
        setState({ loading: false, profile: null, error: err });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [expectedRole, location.pathname]);

  const currentRole = String(state.profile?.role || "").trim().toLowerCase();
  const roleMismatch = !!expectedRole && !!currentRole && currentRole !== expectedRole;

  React.useEffect(() => {
    if (!roleMismatch) return;
    try {
      localStorage.removeItem("currentUser");
    } catch {
      // ignore
    }
  }, [roleMismatch]);

  if (state.loading) return null;

  if (state.error) {
    if (state.error?.status === 401) {
      return <Navigate to={LOGIN_BY_ROLE[expectedRole] || "/"} replace state={{ from: location }} />;
    }
    return <Navigate to="/" replace />;
  }

  if (!currentRole) return <Navigate to="/" replace />;

  if (roleMismatch) {
    return <Navigate to={DASHBOARD_BY_ROLE[currentRole] || "/"} replace />;
  }

  return children;
}

