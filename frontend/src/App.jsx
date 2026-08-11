import { useAuth } from "./hooks/useAuth.js";
import { GlobalLoadingOverlay } from "./components/feedback/GlobalLoadingOverlay.jsx";
import { AppRoutes } from "./routes/AppRoutes.jsx";

function App() {
  const { isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <GlobalLoadingOverlay message="Loading application shell" />;
  }

  return <AppRoutes />;
}

export default App;
