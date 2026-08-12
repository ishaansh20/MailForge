import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { PageLoader } from "../components/feedback/PageLoader.jsx";
import { PublicLayout } from "../layouts/PublicLayout.jsx";
import { ProtectedLayout } from "../layouts/ProtectedLayout.jsx";
import { AppLayout } from "../layouts/AppLayout.jsx";
import { ProtectedRoute } from "./ProtectedRoute.jsx";

const LoginPage = lazy(() =>
  import("../pages/LoginPage.jsx").then((module) => ({
    default: module.LoginPage,
  })),
);
const RegisterPage = lazy(() =>
  import("../pages/RegisterPage.jsx").then((module) => ({
    default: module.RegisterPage,
  })),
);
const ForgotPasswordPage = lazy(() =>
  import("../pages/ForgotPasswordPage.jsx").then((module) => ({
    default: module.ForgotPasswordPage,
  })),
);
const ResetPasswordPage = lazy(() =>
  import("../pages/ResetPasswordPage.jsx").then((module) => ({
    default: module.ResetPasswordPage,
  })),
);
const NotFoundPage = lazy(() =>
  import("../pages/NotFoundPage.jsx").then((module) => ({
    default: module.NotFoundPage,
  })),
);
const UnauthorizedPage = lazy(() =>
  import("../pages/UnauthorizedPage.jsx").then((module) => ({
    default: module.UnauthorizedPage,
  })),
);
const DashboardPage = lazy(() =>
  import("../features/dashboard/DashboardPage.jsx").then((module) => ({
    default: module.DashboardPage,
  })),
);
const SmtpPage = lazy(() =>
  import("../features/smtp/SmtpPage.jsx").then((module) => ({
    default: module.SmtpPage,
  })),
);
const ContactsPage = lazy(() =>
  import("../features/contacts/ContactsPage.jsx").then((module) => ({
    default: module.ContactsPage,
  })),
);
const ListsPage = lazy(() =>
  import("../features/lists/ListsPage.jsx").then((module) => ({
    default: module.ListsPage,
  })),
);
const CampaignsPage = lazy(() =>
  import("../features/campaigns/CampaignsPage.jsx").then((module) => ({
    default: module.CampaignsPage,
  })),
);
const CampaignWizardPage = lazy(() =>
  import("../features/campaigns/CampaignWizardPage.jsx").then((module) => ({
    default: module.CampaignWizardPage,
  })),
);
const TemplatesPage = lazy(() =>
  import("../features/templates/TemplatesPage.jsx").then((module) => ({
    default: module.TemplatesPage,
  })),
);
const LogsPage = lazy(() =>
  import("../features/logs/LogsPage.jsx").then((module) => ({
    default: module.LogsPage,
  })),
);
const AnalyticsPage = lazy(() =>
  import("../features/analytics/AnalyticsPage.jsx").then((module) => ({
    default: module.AnalyticsPage,
  })),
);
const SettingsPage = lazy(() =>
  import("../features/settings/SettingsPage.jsx").then((module) => ({
    default: module.SettingsPage,
  })),
);
const UnsubscribePage = lazy(() =>
  import("../pages/UnsubscribePage.jsx").then((module) => ({
    default: module.UnsubscribePage,
  })),
);

function GuestRoute() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Suspense fallback={<PageLoader label="Loading page" />}>
      <Routes>
        <Route
          path="/"
          element={
            <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
          }
        />

        <Route element={<PublicLayout />}>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/unsubscribe/:token" element={<UnsubscribePage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<ProtectedLayout />}>
            <Route element={<AppLayout />}>
              <Route
                path="/app"
                element={<Navigate to="/dashboard" replace />}
              />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/smtp" element={<SmtpPage />} />
              <Route path="/contacts" element={<ContactsPage />} />
              <Route path="/lists" element={<ListsPage />} />
              <Route path="/templates" element={<TemplatesPage />} />
              <Route path="/campaigns" element={<CampaignsPage />} />
              <Route path="/campaigns/new" element={<CampaignWizardPage />} />
              <Route path="/logs" element={<LogsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
            </Route>
          </Route>
        </Route>

        <Route
          path="*"
          element={
            isAuthenticated ? (
              <NotFoundPage />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Suspense>
  );
}

export { AppRoutes };
