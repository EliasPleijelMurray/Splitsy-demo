import { createBrowserRouter } from "react-router";
import { Home } from "./pages/Home";
import { Layout } from "./pages/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Login } from "./pages/Login";

export const router = createBrowserRouter([
      {
        path: "/login",
        element: <Login />
    },
    {
        path: "/",
        element: <Layout />,
        children: [
            {
                path: "/",
                element: <Home />
            },
            {
                path: "/dashboard",
                element: <Dashboard />
            }
        ]
    }
])