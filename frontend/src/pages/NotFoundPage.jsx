import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button.jsx";
import { Card, CardContent } from "../components/ui/Card.jsx";

function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4 py-10">
      <Card className="w-full max-w-lg">
        <CardContent className="space-y-4 py-10 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-stone-400">
            404
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950">
            Page not found
          </h1>
          <p className="text-sm leading-6 text-stone-500">
            The page you are looking for does not exist or has been moved.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button as={Link} to="/dashboard">
              Go to Dashboard
            </Button>
            <Button as={Link} to="/login" variant="secondary">
              Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export { NotFoundPage };
