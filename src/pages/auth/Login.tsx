import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import useAuth from "@/hooks/useAuth";
import { Loader2, Eye, EyeOff, Mail, KeyRound, Leaf } from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";
import { toaster } from "@/lib/sonner";
import { handleError } from "@/lib/utils";
import axios from "axios";

const signInSchema = z.object({
  email: z
    .string()
    .email("Email tidak valid")
    .refine(
      (email) =>
        email.endsWith("@student.unri.ac.id") ||
        email.endsWith("@lecturer.unri.ac.id") ||
        email.endsWith("@eng.unri.ac.id"),
      {
        message:
          "Gunakan email kampus Universitas Riau (student.unri.ac.id atau lecturer.unri.ac.id)",
      }
    ),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

type FormErrors = {
  email?: string;
  password?: string;
};

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const { setAuth } = useAuth();
  const navigate = useNavigate();

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (formErrors.email) {
      setFormErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (formErrors.password) {
      setFormErrors((prev) => ({ ...prev, password: undefined }));
    }
  };

  const handleRecaptchaVerify = (token: string | null) => {
    setRecaptchaToken(token);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setFormErrors({});

    try {
      const result = signInSchema.safeParse({ email, password });
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        setFormErrors({
          email: errors.email?.[0],
          password: errors.password?.[0],
        });
        setIsLoading(false);
        return;
      }

      if (!recaptchaToken) {
        setFormErrors({
          email: undefined,
          password: "Harap selesaikan reCAPTCHA",
        });
        setIsLoading(false);
        return;
      }

      const response = await axios.post(
        "http://localhost:5500/api/auth/login",
        {
          email,
          password,
          recaptchaToken,
        }
      );
      const { token, user } = response.data;
      setAuth({ user, token });
      localStorage.setItem("token", token);
      navigate("/dashboard");
    } catch (err) {
      const errorMessage = handleError(err);
      toaster.error(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2 bg-white">
      {/* Left Column - Login Form */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex flex-col items-center gap-1 mb-6">
              <h2 className="text-3xl font-black font-heading tracking-tight text-env-base">
                Selamat Datang
              </h2>
              <p className="text-sm text-gray-600">
                Masuk ke akun Anda untuk melanjutkan
              </p>
            </div>
          </div>

          <Card className="border-0 shadow-none">
            <CardContent className="space-y-6 p-0">
              {(formErrors.email || formErrors.password) && (
                <Alert variant="destructive" className="mb-4 text-sm">
                  <AlertDescription>
                    {formErrors.email || formErrors.password}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-700"
                  >
                    Email Kampus
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@[student/lecturer].unri.ac.id"
                      className="h-11 pl-10 placeholder:text-sm border-gray-300 focus:ring-2 focus:ring-env-base"
                      value={email}
                      onChange={handleEmailChange}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="password"
                      className="text-sm font-medium text-gray-700"
                    >
                      Kata Sandi
                    </Label>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="********"
                      className="h-11 pl-10 pr-10 placeholder:text-sm border-gray-300 focus:ring-2 focus:ring-env-base"
                      value={password}
                      onChange={handlePasswordChange}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      <span className="sr-only">
                        {showPassword
                          ? "Sembunyikan kata sandi"
                          : "Tampilkan kata sandi"}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-center w-full">
                  <ReCAPTCHA
                    sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                    onChange={handleRecaptchaVerify}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-env-base hover:bg-env-dark text-white font-medium text-base"
                  disabled={isLoading}
                  onClick={handleSubmit}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sedang masuk...
                    </>
                  ) : (
                    "Masuk"
                  )}
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500">Atau</span>
                </div>
              </div>

              <div className="text-center text-sm text-gray-600">
                Belum punya akun?{" "}
                <Link
                  to="/register"
                  className="font-medium text-env-base hover:text-env-light"
                >
                  Daftar sekarang
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="text-center text-xs text-gray-600">
            <p>
              © {new Date().getFullYear()} S1 Teknik Lingkungan - Universitas
              Riau
            </p>
            <p className="mt-1">Latest</p>
          </div>
        </div>
      </div>

      {/* Right Column - Visual */}
      <div className="hidden lg:block bg-gradient-to-br from-env-base via-env-dark to-blue-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative h-full flex flex-col justify-center items-center p-12 text-white">
          <div className="max-w-md text-center space-y-6">
            <div className="w-24 h-24 mx-auto bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Leaf className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold">Selamat Datang di Latest</h3>
            <p className="text-lg text-blue-100">
              Bergabunglah dengan ribuan pengguna yang mempercayai platform kami
              untuk administrasi tugas akhir Teknik Lingkungan.
            </p>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-white/5 rounded-full blur-xl" />
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-white/5 rounded-full blur-xl" />
        <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-white/10 rounded-full blur-lg" />
      </div>
    </div>
  );
};

export default Login;
