import { useLocation } from "react-router";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
        <Button onClick={() => navigate("/")} variant="default">
          Return to Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;