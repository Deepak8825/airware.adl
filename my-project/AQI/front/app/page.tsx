"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Wind } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

const LoginPage = () => {
  const router = useRouter();
  const { t } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  useEffect(() => {
    const token = localStorage.getItem("airware_token");
    if (token) {
      router.replace("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!email || !password) {
      setError(t.auth.invalidCredentials);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${backendBase}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(t.auth.invalidCredentials);
        }
        throw new Error("Login failed");
      }

      const data = await response.json();
      if (!data?.access_token) {
        throw new Error("Token missing in response");
      }

      localStorage.setItem("airware_token", data.access_token);
      router.replace("/dashboard");
    } catch (loginError) {
      const message = loginError instanceof Error ? loginError.message : t.auth.invalidCredentials;
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-100 to-cyan-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col lg:flex-row">
      <div className="lg:w-1/2 flex flex-col justify-between p-10 text-white relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex items-center gap-3"
        >
          <div className="bg-white/20 rounded-full p-3">
            <Wind className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">AirWare</h1>
            <p className="text-white/80">{t.home.subtitle}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="max-w-xl"
        >
          <h2 className="text-4xl font-extrabold drop-shadow-lg mb-6">
            {t.home.title}
          </h2>
          <p className="text-lg text-white/80 leading-relaxed">
            Monitor live air quality, track health insights, and plan your day with confidence. Sign in to access your personalised dashboard and stay ahead of changing conditions.
          </p>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "Live AQI monitoring",
              "Personalised health alerts",
              "Location-based forecasting",
              "Secure data storage",
            ].map((feature, index) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1, duration: 0.6 }}
                className="backdrop-blur-sm bg-white/15 border border-white/20 rounded-xl p-4"
              >
                <p className="font-semibold">{feature}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="hidden lg:block text-white/70"
        >
          <p>© {new Date().getFullYear()} AirWare. All rights reserved.</p>
        </motion.div>

        <div className="absolute -top-32 -right-32 w-72 h-72 bg-white/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-cyan-200/40 rounded-full blur-3xl" />
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-2xl">
            <CardHeader className="border-b border-gray-100 dark:border-gray-800">
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                {t.auth.login}
              </CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t.home.subtitle}
              </p>
            </CardHeader>
            <CardContent className="space-y-6 mt-2">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-200" htmlFor="email">
                    {t.auth.email}
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@example.com"
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-200" htmlFor="password">
                    {t.auth.password}
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    required
                    className="h-12"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? `${t.common.loading}` : t.auth.signIn}
                </Button>
              </form>

              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                <span>{t.auth.dontHaveAccount} </span>
                <Link href="/register" className="text-blue-600 hover:underline">
                  {t.auth.signUp}
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
