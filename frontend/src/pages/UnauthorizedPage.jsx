import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button.jsx";
import { Card, CardContent } from "../components/ui/Card.jsx";

function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4 py-10">
      <Card className="w-full max-w-lg">
        <CardContent className="space-y-4 py-10 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-stone-400">
            403
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950">
            Unauthorized
          </h1>
          <p className="text-sm leading-6 text-stone-500">
            You do not have permission to access this resource.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button as={Link} to="/dashboard">
              Return to Dashboard
            </Button>
            <Button as={Link} to="/login" variant="secondary">
              Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export { UnauthorizedPage };
