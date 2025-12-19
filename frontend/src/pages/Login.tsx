import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Button from "../components/Button";
import { authService } from "../services/authService";

export const Login = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isLogin) {
        // Handle login
        const user = await authService.login({
          email: formData.email,
          password: formData.password,
        });
        console.log("Logged in user:", user);
        // Redirect to dashboard after successful login
        navigate("/dashboard");
      } else {
        // Handle registration
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords don't match!");
          setIsLoading(false);
          return;
        }

        const user = await authService.register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });
        console.log("Registered user:", user);
        // Redirect to dashboard after successful registration
        navigate("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#FFF0C3" }}
    >
      <div className="px-6 py-4">
        <Link to="/">
          <img
            src="/Logga.svg"
            alt="Logo"
            className="h-12 w-auto cursor-pointer"
          />
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg border-2 border-black">
          <div>
            <h2 className="text-center text-3xl font-bold">
              {isLogin ? "Log in to your account" : "Create new account"}
            </h2>
          </div>

          <div className="flex gap-2 border-b-2 border-gray-200">
            <button
              type="button"
              className={`flex-1 pb-2 font-medium transition-colors ${
                isLogin
                  ? "border-b-2 border-black text-black"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => {
                setIsLogin(true);
                setFormData({
                  email: "",
                  password: "",
                  confirmPassword: "",
                  name: "",
                });
                setError("");
              }}
            >
              Login
            </button>
            <button
              type="button"
              className={`flex-1 pb-2 font-medium transition-colors ${
                !isLogin
                  ? "border-b-2 border-black text-black"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => {
                setIsLogin(false);
                setFormData({
                  email: "",
                  password: "",
                  confirmPassword: "",
                  name: "",
                });
                setError("");
              }}
            >
              Sign Up
            </button>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {!isLogin && (
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required={!isLogin}
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:outline-none focus:border-black"
                    placeholder="Elias"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:outline-none focus:border-black"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:outline-none focus:border-black"
                  placeholder="••••••••"
                />
              </div>

              {!isLogin && (
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required={!isLogin}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:outline-none focus:border-black"
                    placeholder="••••••••"
                  />
                </div>
              )}
            </div>

            <div>
              <Button
                type="submit"
                className="w-full py-2"
                disabled={isLoading}
              >
                {isLoading
                  ? "Please wait..."
                  : isLogin
                  ? "Log In"
                  : "Create Account"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
