import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "./ui/Button";
import { routeForRole } from "../lib/routeForRole";

export default function Navbar() {
    const { user, logout } = useAuth();
    const nav = useNavigate();
    const authed = !!user;

    return (
        <header className="sticky top-0 z-40 border-b bg-white/70 backdrop-blur">
            <div className="container h-14 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2" aria-label="Go to home">
                    <span className="h-7 w-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 shadow"></span>
                    <span className="font-semibold">Insurance Platform</span>
                </Link>

                <nav className="flex items-center gap-3">
                    {!authed ? (
                        <>
                            <Link to="/login" className="text-sm text-slate-700 hover:underline">
                                Login
                            </Link>
                            <Link
                                to="/register"
                                className="inline-flex h-9 items-center justify-center rounded-lg bg-indigo-600 px-3 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                            >
                                Sign up
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link
                                to={routeForRole(user?.role)}
                                className="hidden sm:block text-sm text-slate-700 hover:underline"
                            >
                                Dashboard
                            </Link>
                            <span className="hidden sm:block text-sm text-slate-600">
                                {user?.name} · {user?.role}
                            </span>
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                    logout();
                                    nav("/login");
                                }}
                            >
                                Logout
                            </Button>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
}
