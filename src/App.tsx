import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CompanyDashboard from "./pages/CompanyDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import ProviderDashboard from "./pages/ProviderDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import RequestDetails from "./pages/RequestDetails";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Shield,
  Handshake,
  Layers,
  Users,
  BarChart3,
  Clock,
  Building2,
  Lock,
  ArrowRight,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};
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
    <main className="relative min-h-[100dvh] overflow-hidden bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
      {/* soft grid + blobs */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(100,116,139,.15) 1px, transparent 0)",
          backgroundSize: "28px 28px",
          maskImage:
            "radial-gradient(ellipse at center, black 55%, transparent 70%)",
        }}
      />
      <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full blur-3xl bg-[#6F17CE]/20" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full blur-3xl bg-[#23B5EE]/20" />

      {/* Hero */}
      <section className="container relative z-10 flex flex-col items-center px-4 pt-20 pb-12 md:pt-28">
        <motion.span
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300"
        >
          <Shield className="h-4 w-4" />
          Enterprise-grade Insurance Collaboration
        </motion.span>

        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mt-6 max-w-4xl text-center text-4xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-5xl dark:text-white"
        >
          Build, Bid & Bind{" "}
          <span className="bg-gradient-to-r from-[#6F17CE] to-[#23B5EE] bg-clip-text text-transparent">
            collaborative insurance
          </span>{" "}
          at velocity.
        </motion.h1>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mt-4 max-w-2xl text-center text-slate-600 md:text-lg dark:text-slate-300"
        >
          Our platform orchestrates RFPs, multi-provider consortia, coverage
          tracking, and secure communication—so carriers co-underwrite complex
          risks with precision.
        </motion.p>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            to="/login"
            className="bg-gradient-to-r from-[#6F17CE] to-[#23B5EE] text-white rounded-lg font-medium hover:from-[#5e14b6] hover:to-[#1fa0d4] focus:outline-none focus:ring-2 focus:ring-[#6F17CE] focus:ring-offset-2 transition-all py-2.5 px-5"
          >
            Get Started
          </Link>
          <Link
            to="/register"
            className="rounded-lg border border-slate-300 bg-white/70 py-2.5 px-5 text-slate-800 transition-all hover:bg-white hover:shadow dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
          >
            Create Account
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 rounded-lg py-2.5 px-5 text-slate-700 transition hover:opacity-90 dark:text-slate-300"
          >
            See how it works <ArrowRight className="h-5 w-5" />
          </a>
        </motion.div>

        {/* Trust row */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mt-10 grid w-full max-w-4xl grid-cols-2 items-center gap-6 opacity-80 md:grid-cols-4"
        >
          {["Reinsurance Ready", "HIPAA Aligned", "99.9% Uptime", "SOC2 Pipeline"].map(
            (item) => (
              <div
                key={item}
                className="text-center text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400"
              >
                {item}
              </div>
            )
          )}
        </motion.div>
      </section>

      {/* Features */}
      <section className="container relative z-10 px-4 pb-16">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mx-auto max-w-3xl text-center"
        >
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Value props that move the needle
          </h2>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Designed for insurers, brokers, and enterprises to converge on
            outcomes faster.
          </p>
        </motion.div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-50px" }}
              className="group rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900/60"
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-[#6F17CE]/15 to-[#23B5EE]/15">
                <f.icon className="h-5 w-5 text-[#6F17CE]" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {f.title}
              </h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {f.desc}
              </p>
              <div className="mt-3 text-sm font-medium text-slate-700 group-hover:translate-x-0.5 transition dark:text-slate-300">
                Learn more →
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="container relative z-10 px-4 pb-20 md:pb-24"
      >
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="text-center text-2xl font-bold text-slate-900 dark:text-white"
        >
          How it works
        </motion.h2>

        <div className="mx-auto mt-8 grid max-w-5xl gap-4 md:grid-cols-3">
          {steps.map((s, idx) => (
            <motion.div
              key={s.title}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="relative rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60"
            >
              <span className="absolute -top-3 left-6 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-[#6F17CE] to-[#23B5EE] text-sm font-bold text-white shadow">
                {idx + 1}
              </span>
              <s.icon className="mb-3 h-6 w-6 text-[#6F17CE]" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {s.title}
              </h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {s.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Footer */}
      <section className="relative z-10 px-4 pb-24">
        <div className="container">
          <div className="rounded-3xl border border-slate-200 bg-white/80 p-8 text-center shadow-md backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              Ready to operationalize smarter coverage?
            </h3>
            <p className="mx-auto mt-2 max-w-2xl text-slate-600 dark:text-slate-300">
              Spin up your account, invite providers, and finalize consortia in
              days—not months.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to="/login"
                className="bg-gradient-to-r from-[#6F17CE] to-[#23B5EE] text-white rounded-lg font-medium hover:from-[#5e14b6] hover:to-[#1fa0d4] focus:outline-none focus:ring-2 focus:ring-[#6F17CE] focus:ring-offset-2 transition-all py-2.5 px-5"
              >
                Launch Dashboard
              </Link>
              <Link
                to="/register"
                className="rounded-lg border border-slate-300 bg-white/70 py-2.5 px-5 text-slate-800 transition-all hover:bg-white hover:shadow dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
              >
                Create Free Account
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

const features = [
  {
    icon: Shield,
    title: "Smart RFPs",
    desc: "Create structured requests, set target coverage, deadlines, and compliance guardrails.",
  },
  {
    icon: Handshake,
    title: "Consortium Builder",
    desc: "Compose multi-carrier deals; allocate coverage and premiums transparently.",
  },
  {
    icon: Layers,
    title: "Deal Finalization",
    desc: "One-click finalize with auditable snapshots and automated notifications.",
  },
  {
    icon: Users,
    title: "Provider Network",
    desc: "Discover verified providers, track bids, and manage relationships.",
  },
  {
    icon: BarChart3,
    title: "Coverage Analytics",
    desc: "Live coverage progress, premium insights, and bid competitiveness.",
  },
  {
    icon: Lock,
    title: "Secure Messaging",
    desc: "Encrypted, role-based messaging between companies and providers.",
  },
  {
    icon: Building2,
    title: "Enterprise Controls",
    desc: "Org roles, approval flows, and exportable audit trails.",
  },
  {
    icon: Clock,
    title: "Faster Time-to-Bind",
    desc: "Collapse underwriting cycles with guided workflows and automation.",
  },
];

const steps = [
  {
    icon: Building2,
    title: "Post Request",
    desc: "Define risk summary, target coverage %, timelines, and constraints.",
  },
  {
    icon: Handshake,
    title: "Receive & Compose",
    desc: "Providers bid; you assemble a consortium and negotiate terms.",
  },
  {
    icon: Shield,
    title: "Finalize & Track",
    desc: "Bind the deal, notify winners, and monitor coverage in real time.",
  },
];
