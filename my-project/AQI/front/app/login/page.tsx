"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Wind, Lock, Mail } from "lucide-react";

import { Button } from "../../components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

interface LoginPayload {
  email: string;
  password: string;
}

const LoginPage = () => {
  const router = useRouter();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  useEffect(() => {
    const token = localStorage.getItem("airware_token");
    if (token) {
      router.replace("/dashboard");
    }
  }, [router]);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!formData.email.trim() || !formData.password) {
      setError("Please enter both email and password");
      return;
    }

    const payload: LoginPayload = {
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
    };

    setIsSubmitting(true);

    try {
      const response = await fetch(`${backendBase}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const message = response.status === 401 ? "Invalid email or password" : "Login failed";
        throw new Error(message);
      }

      const data = await response.json();
      
      if (data.access_token) {
        localStorage.setItem("airware_token", data.access_token);
        router.replace("/dashboard");
      } else {
        throw new Error("No token received");
      }
    } catch (loginError) {
      const message = loginError instanceof Error ? loginError.message : "Unable to login";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-5xl"
      >
        <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-2xl border-0 overflow-hidden">
          <div className="grid gap-0 lg:grid-cols-2">
            {/* Left Side - Branding */}
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-cyan-600 to-indigo-600 p-12 text-white flex flex-col justify-between">
              <div>
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="flex items-center gap-3 mb-12"
                >
                  <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl">
                    <Wind className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">AirWare</h2>
                    <p className="text-white/90 text-sm">Breathe Better, Live Better</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="space-y-6"
                >
                  <h3 className="text-4xl font-bold leading-tight">
                    Welcome back to cleaner air insights
                  </h3>
                  <p className="text-white/90 text-lg leading-relaxed">
                    Access real-time air quality data, personalized health recommendations, and forecasts tailored to your location.
                  </p>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="space-y-4"
              >
                {["Real-time AQI monitoring", "Personalized alerts", "Expert health tips"].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <span className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                      <div className={`w-2 h-2 rounded-full bg-white`}></div>
                    </span>
                    <span className="text-white/90">{item}</span>
                  </div>
                ))}
              </motion.div>

              {/* Decorative elements */}
              <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
              <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />
            </div>

            {/* Right Side - Login Form */}
            <div className="p-8 sm:p-12 flex flex-col justify-center">
              <CardHeader className="p-0 mb-8">
                <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
                  {t.auth.signIn || "Sign In"}
                </CardTitle>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  Enter your credentials to access your account
                </p>
              </CardHeader>
              
              <CardContent className="p-0 space-y-6">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border-l-4 border-red-500 bg-red-50 px-5 py-4 text-sm text-red-700 shadow-sm"
                  >
                    {error}
                  </motion.div>
                )}

                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-white flex items-center gap-2" htmlFor="email">
                      <Mail className="w-4 h-4 text-gray-300" />
                      {t.auth.email || "Email"}
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(event) => updateField("email", event.target.value)}
                      placeholder="name@example.com"
                      required
                      className="h-13 px-4 text-base border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-white flex items-center gap-2" htmlFor="password">
                      <Lock className="w-4 h-4 text-gray-300" />
                      {t.auth.password || "Password"}
                    </label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(event) => updateField("password", event.target.value)}
                      placeholder="Enter your password"
                      required
                      className="h-13 px-4 text-base border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Remember me</span>
                    </label>
                    <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors">
                      Forgot password?
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-13 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-base font-semibold transition-all duration-200 shadow-lg hover:shadow-xl rounded-xl"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (t.common.loading || "Signing in...") : (t.auth.signIn || "Sign In")}
                  </Button>
                </form>

                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white dark:bg-gray-900 text-gray-500">Or</span>
                  </div>
                </div>

                <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                  <span>Don&apos;t have an account? </span>
                  <Link href="/register" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors">
                    {t.auth.signUp || "Sign up"}
                  </Link>
                </div>
              </CardContent>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default LoginPage;
