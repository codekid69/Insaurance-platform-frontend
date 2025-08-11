import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CompanyDashboard from "./pages/CompanyDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import ProviderDashboard from "./pages/ProviderDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import RequestDetails from "./pages/RequestDetails";

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/provider" element={<ProtectedRoute roles={["provider"]}><ProviderDashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
        <Route
          path="/requests/:id"
          element={<ProtectedRoute roles={["company"]}><RequestDetails /></ProtectedRoute>}
        />
        <Route
          path="/company"
          element={<ProtectedRoute roles={["company"]}><CompanyDashboard /></ProtectedRoute>}
        />

        {/* we’ll add /provider and /admin next */}
      </Routes>
    </div>
  );
}

function Home() {
  return (
    <div className="container py-10">
      <div className="rounded-2xl border bg-white/70 p-8 shadow-sm">
        <h1 className="text-2xl font-bold">Welcome</h1>
        <p className="mt-2 text-slate-600">
          Login or create an account, then you’ll be redirected to your dashboard.
        </p>
      </div>
    </div>
  );
}
