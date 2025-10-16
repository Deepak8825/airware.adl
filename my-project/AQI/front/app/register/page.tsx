"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, UserPlus } from "lucide-react";

import { Button } from "../../components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

interface RegistrationPayload {
  name: string;
  email: string;
  password: string;
  language?: string;
  city?: string;
  country?: string;
  occupation?: string;
  interestedInPrediction?: boolean;
}

const RegisterPage = () => {
  const router = useRouter();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    city: "",
    country: "",
    occupation: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
    setSuccess(null);

    if (!formData.name.trim()) {
      setError(t.auth.nameRequired);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const payload: RegistrationPayload = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      city: formData.city || undefined,
      country: formData.country || undefined,
      occupation: formData.occupation || undefined,
    };

    setIsSubmitting(true);

    try {
      const response = await fetch(`${backendBase}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const message = response.status === 400 ? "An account with this email already exists" : "Registration failed";
        throw new Error(message);
      }

      setSuccess(t.auth.registerSuccess);
      setTimeout(() => {
        router.replace("/");
      }, 1200);
    } catch (registerError) {
      const message = registerError instanceof Error ? registerError.message : "Unable to register";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-3xl"
      >
        <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-2xl border-0">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="relative overflow-hidden rounded-l-3xl bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 p-8 text-white flex flex-col justify-between">
              <div>
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="flex items-center gap-3"
                >
                  <ShieldCheck className="w-10 h-10" />
                  <div>
                    <h2 className="text-2xl font-bold">AirWare</h2>
                    <p className="text-white/80">Secure environmental insights</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="mt-10 space-y-4"
                >
                  <h3 className="text-3xl font-semibold">Create your account</h3>
                  <p className="text-white/80 leading-relaxed">
                    Join our community to unlock personalised air quality dashboards, health recommendations, and real-time alerts tailored to your location.
                  </p>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="space-y-3"
              >
                {["Encrypted login", "Trusted meteorological data", "Expert health guidance"].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <span className="bg-white/20 rounded-full p-2">
                      <UserPlus className="w-5 h-5" />
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </motion.div>

              <div className="absolute -top-20 -right-16 h-60 w-60 rounded-full bg-white/30 blur-3xl" />
              <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl" />
            </div>

            <div className="p-6 sm:p-10">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t.auth.register}
                </CardTitle>
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
                {success && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border-l-4 border-green-500 bg-green-50 px-5 py-4 text-sm text-green-700 shadow-sm"
                  >
                    {success}
                  </motion.div>
                )}

                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1" htmlFor="name">
                        {t.auth.name} <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(event) => updateField("name", event.target.value)}
                        placeholder="Jane Doe"
                        required
                        className="h-12 px-4 text-base border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl transition-all"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1" htmlFor="email">
                        {t.auth.email} <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(event) => updateField("email", event.target.value)}
                        placeholder="name@example.com"
                        required
                        className="h-12 px-4 text-base border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1" htmlFor="password">
                        {t.auth.password} <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(event) => updateField("password", event.target.value)}
                        placeholder="Create password"
                        required
                        className="h-12 px-4 text-base border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1" htmlFor="confirmPassword">
                        {t.auth.confirmPassword} <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(event) => updateField("confirmPassword", event.target.value)}
                        placeholder="Repeat password"
                        required
                        className="h-12 px-4 text-base border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl transition-all"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-4">
                      Optional Information
                    </p>
                    <div className="grid gap-5 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200" htmlFor="city">
                          City
                        </label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(event) => updateField("city", event.target.value)}
                          placeholder="Coimbatore"
                          className="h-12 px-4 text-base border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200" htmlFor="country">
                          Country
                        </label>
                        <Input
                          id="country"
                          value={formData.country}
                          onChange={(event) => updateField("country", event.target.value)}
                          placeholder="India"
                          className="h-12 px-4 text-base border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 mt-5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-200" htmlFor="occupation">
                        Occupation
                      </label>
                      <Input
                        id="occupation"
                        value={formData.occupation}
                        onChange={(event) => updateField("occupation", event.target.value)}
                        placeholder="Student, Developer, ..."
                        className="h-12 px-4 text-base border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl transition-all"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-13 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-base font-semibold transition-all duration-200 shadow-lg hover:shadow-xl rounded-xl mt-6"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? t.common.loading : t.auth.signUp}
                  </Button>
                </form>

                <div className="text-center text-sm text-gray-600 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <span>{t.auth.alreadyHaveAccount} </span>
                  <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline transition-colors">
                    {t.auth.signIn}
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

export default RegisterPage;
