import Button from "./Button";
import { Link, useLocation, useNavigate } from "react-router";
import { authService } from "../services/authService";
import { useEffect, useState } from "react";

export const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const user = await authService.getCurrentUser();
      setIsAuthenticated(user !== null);
    };
    checkAuth();
  }, [location.pathname]);

  const handleSignOut = async () => {
    try {
      await authService.logout();
      setIsAuthenticated(false);
      navigate("/");
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between px-6 py-4">
        <div className="Logo">
          <img src="/Logga.svg" alt="" className="h-12 w-auto" />
        </div>
        {isAuthenticated ? (
          <Button onClick={handleSignOut}>Sign out</Button>
        ) : (
          <Link to="/login">
            <Button>Sign in</Button>
          </Link>
        )}
      </div>
    </>
  );
};
