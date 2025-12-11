import Button from "./Button";
import { Link } from "react-router";

export const Header = () => {
  return (
    <>
      <div className="flex items-center justify-between px-6 py-4">
        <div className="Logo">
          <img src="/Logga.svg" alt="" className="h-12 w-auto" />
        </div>
        <Link to="/login">
          <Button>Logga in</Button>
        </Link>
      </div>
    </>
  );
};
