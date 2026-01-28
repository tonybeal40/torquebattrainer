import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

export default function AgeVerificationPage() {
  const [, setLocation] = useLocation();
  const [birthYear, setBirthYear] = useState("");
  const [hasConsent, setHasConsent] = useState(false);
  const [error, setError] = useState("");

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  const handleVerify = () => {
    if (!birthYear) {
      setError("Please select your birth year");
      return;
    }

    const age = currentYear - parseInt(birthYear);

    if (age < 13) {
      setError("You must be at least 13 years old to use this app");
      return;
    }

    if (age < 18 && !hasConsent) {
      setError("Parental or guardian consent is required for users under 18");
      return;
    }

    localStorage.setItem("age_verified", "true");
    localStorage.setItem("age_verified_date", new Date().toISOString());
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/80 border border-slate-700/50 rounded-2xl p-8 max-w-md w-full shadow-2xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Age Verification</h1>
          <p className="text-slate-400 text-sm">
            Please verify your age to continue
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Birth Year
            </label>
            <select
              value={birthYear}
              onChange={(e) => {
                setBirthYear(e.target.value);
                setError("");
              }}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              data-testid="select-birth-year"
            >
              <option value="">Select year</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {birthYear && currentYear - parseInt(birthYear) < 18 && currentYear - parseInt(birthYear) >= 13 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-4"
            >
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasConsent}
                  onChange={(e) => {
                    setHasConsent(e.target.checked);
                    setError("");
                  }}
                  className="mt-1 w-5 h-5 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                  data-testid="checkbox-parental-consent"
                />
                <span className="text-sm text-amber-200">
                  I confirm that I have parental or guardian consent to use this application
                </span>
              </label>
            </motion.div>
          )}

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-sm text-center"
              data-testid="text-age-error"
            >
              {error}
            </motion.p>
          )}

          <button
            onClick={handleVerify}
            className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold py-3 rounded-lg transition-all shadow-lg"
            data-testid="button-verify-age"
          >
            Continue
          </button>

          <p className="text-xs text-slate-500 text-center">
            By continuing, you agree to our{" "}
            <a href="/terms" className="text-sky-400 hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="text-sky-400 hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
