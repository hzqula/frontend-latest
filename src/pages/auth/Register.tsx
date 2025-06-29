import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { toaster } from "@/lib/sonner";
import { registerEmail, verifyOtp, registerUser } from "@/services/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import useAuth from "@/hooks/useAuth";
import { RegisterUserRequest } from "@/types/auth";
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  KeyRound,
  User,
  Upload,
  Phone,
  IdCard,
  Loader2,
  Leaf,
  EyeIcon,
  EyeOffIcon,
} from "lucide-react";
import Stepper from "@/components/Stepper";
import { handleError } from "@/lib/utils"; // Impor handleError dari lib/utils.ts

// Skema validasi Zod
const emailSchema = z.object({
  email: z
    .string()
    .email("Email tidak valid")
    .refine(
      (email) =>
        email.endsWith("@student.unri.ac.id") ||
        email.endsWith("@lecturer.unri.ac.id"),
      {
        message:
          "Gunakan email kampus UR (@student.unri.ac.id atau @lecturer.unri.ac.id)",
      }
    ),
});

const otpSchema = z.object({
  otp: z
    .string()
    .min(6, "OTP harus 6 digit")
    .max(6, "OTP harus 6 digit")
    .regex(/^\d+$/, "OTP hanya boleh berisi angka"),
});

const userDataSchema = z
  .object({
    email: z.string().email("Email tidak valid"),
    name: z.string().min(1, "Nama wajib diisi"),
    nim: z
      .string()
      .optional()
      .refine((nim) => !nim || /^\d{8,}$/.test(nim), {
        message: "NIM harus berupa angka dan minimal 8 digit",
      }),
    nip: z
      .string()
      .optional()
      .refine((nip) => !nip || /^\d{8,}$/.test(nip), {
        message: "NIP harus berupa angka dan minimal 8 digit",
      }),
    phoneNumber: z
      .string()
      .min(10, "Nomor telepon tidak valid")
      .max(13, "Nomor telepon tidak valid")
      .regex(/^08\d+$/, "Nomor telepon harus diawali dengan 08"),
    password: z.string().min(8, "Kata sandi minimal 8 karakter"),
    confirmPassword: z
      .string()
      .min(8, "Konfirmasi kata sandi minimal 8 karakter"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Kata sandi dan konfirmasi kata sandi tidak cocok",
    path: ["confirmPassword"],
  })
  .refine((data) => (data.nim && !data.nip) || (!data.nim && data.nip), {
    message: "Hanya salah satu dari NIM atau NIP yang boleh diisi",
    path: ["nim", "nip"],
  });

type FormErrors = {
  email?: string;
  otp?: string;
  name?: string;
  nim?: string;
  nip?: string;
  phoneNumber?: string;
  password?: string;
  confirmPassword?: string;
  profilePicture?: string;
};

const Register = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [isLoadingOtp, setIsLoadingOtp] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [formData, setFormData] = useState<RegisterUserRequest>({
    email: "",
    name: "",
    nim: "",
    nip: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [otp, setOtp] = useState("");
  const [profilePicture, setProfilePicture] = useState<File | undefined>(
    undefined
  );
  const [profilePicturePreview, setProfilePicturePreview] = useState<
    string | null
  >(null);
  const [role, setRole] = useState<"LECTURER" | "STUDENT" | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { setAuth } = useAuth();
  const navigate = useNavigate();

  const steps = ["Email", "Verify", "Details"];

  // Countdown untuk resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && resendDisabled) {
      setResendDisabled(false);
    }
  }, [countdown, resendDisabled]);

  const startResendCountdown = () => {
    setResendDisabled(true);
    setCountdown(60);
  };

  // Handler untuk perubahan input
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, email: value });
    if (value.includes("@lecturer.unri.ac.id")) {
      setRole("LECTURER");
    } else if (value.includes("@student.unri.ac.id")) {
      setRole("STUDENT");
    } else {
      setRole(null);
    }
    if (formErrors.email) {
      setFormErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  const handleProfilePictureChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validasi ukuran file (maks 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setFormErrors((prev) => ({
          ...prev,
          profilePicture: "Ukuran file maksimum adalah 2MB",
        }));
        return;
      }
      // Validasi tipe file
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        setFormErrors((prev) => ({
          ...prev,
          profilePicture:
            "Hanya file gambar (JPEG, JPG, PNG) yang diperbolehkan",
        }));
        return;
      }

      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () =>
        setProfilePicturePreview(reader.result as string);
      reader.readAsDataURL(file);
      setFormErrors((prev) => ({ ...prev, profilePicture: undefined }));
    }
  };

  // API mutations
  const emailMutation = useMutation({
    mutationFn: registerEmail,
    onSuccess: (data) => {
      toaster.success(data.message);
      setCurrentStep(2);
      startResendCountdown();
    },
    onError: (error) => {
      const message = handleError(error);
      toaster.error(message);
    },
  });

  const otpMutation = useMutation({
    mutationFn: verifyOtp,
    onSuccess: (data) => {
      toaster.success(data.message);
    },
    onError: (error) => {
      const message = handleError(error);
      toaster.error(message);
      setCurrentStep(1);
    },
  });

  const userMutation = useMutation({
    mutationFn: (data: { data: RegisterUserRequest; file?: File }) =>
      registerUser(data.data, data.file),
    onSuccess: (data) => {
      toaster.success(data.message);
      setAuth({ user: data.user, token: null });
      navigate("/login");
    },
    onError: (error) => {
      const message = handleError(error);
      toaster.error(message);
    },
  });

  // Handlers untuk submit
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoadingEmail) return;

    setIsLoadingEmail(true);
    try {
      const result = emailSchema.safeParse({ email: formData.email });
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        setFormErrors({ email: errors.email?.[0] });
        return;
      }

      await emailMutation.mutateAsync({ email: formData.email });
    } finally {
      setIsLoadingEmail(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoadingOtp) return;

    setIsLoadingOtp(true);
    try {
      const result = otpSchema.safeParse({ otp });
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        setFormErrors({ otp: errors.otp?.[0] });
        return;
      }

      const startTime = Date.now();
      await otpMutation.mutateAsync({
        email: formData.email,
        code: Number(otp),
      });

      const elapsedTime = Date.now() - startTime;
      const minLoadingTime = 2000;
      if (elapsedTime < minLoadingTime) {
        await new Promise((resolve) =>
          setTimeout(resolve, minLoadingTime - elapsedTime)
        );
      }

      setCurrentStep(3); // Pindah step setelah loading selesai
    } finally {
      setIsLoadingOtp(false);
    }
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoadingDetails) return;

    setIsLoadingDetails(true);
    try {
      const result = userDataSchema.safeParse(formData);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        setFormErrors({
          email: errors.email?.[0],
          name: errors.name?.[0],
          nim: errors.nim?.[0],
          nip: errors.nip?.[0],
          phoneNumber: errors.phoneNumber?.[0],
          password: errors.password?.[0],
          confirmPassword: errors.confirmPassword?.[0],
        });
        return;
      }

      await userMutation.mutateAsync({ data: formData, file: profilePicture });
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Render konten berdasarkan langkah
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <form onSubmit={handleEmailSubmit}>
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
                    value={formData.email}
                    onChange={handleEmailChange}
                    disabled={isLoadingEmail}
                  />
                </div>
                {formErrors.email && (
                  <p className="text-sm text-destructive">{formErrors.email}</p>
                )}
                <p className="text-sm text-gray-600">
                  Gunakan email kampus (@lecturer.unri.ac.id atau
                  @student.unri.ac.id)
                </p>
              </div>
              <Button
                type="submit"
                className="w-full h-11 bg-env-base hover:bg-env-dark text-white font-medium text-base"
                disabled={isLoadingEmail}
              >
                {isLoadingEmail ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mengirim OTP...
                  </>
                ) : (
                  <>
                    Lanjut
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        );

      case 2:
        return (
          <form onSubmit={handleOtpSubmit}>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="otp"
                  className="text-sm font-medium text-gray-700"
                >
                  Kode OTP
                </Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Masukkan kode 6-digit"
                    className="h-11 pl-10 placeholder:text-sm border-gray-300 focus:ring-2 focus:ring-env-base"
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value);
                      setFormErrors((prev) => ({ ...prev, otp: undefined }));
                    }}
                    disabled={isLoadingOtp}
                  />
                </div>
                {formErrors.otp && (
                  <p className="text-sm text-destructive">{formErrors.otp}</p>
                )}
                <p className="text-sm text-gray-600">
                  Kode verifikasi telah dikirim ke {formData.email}
                </p>
                <Button
                  type="button"
                  variant="link"
                  className="justify-start px-0 h-auto text-env-base hover:text-env-light font-medium"
                  onClick={async () => {
                    if (!resendDisabled) {
                      await handleEmailSubmit(new Event("submit") as any);
                    }
                  }}
                  disabled={resendDisabled || isLoadingEmail}
                >
                  {resendDisabled
                    ? `Kirim ulang dalam ${countdown}s`
                    : "Tidak menerima kode? Kirim ulang"}
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 border-gray-300 text-gray-700 hover:bg-gray-50"
                  onClick={() => setCurrentStep(1)}
                  disabled={isLoadingOtp || isLoadingEmail}
                >
                  {isLoadingOtp ? (
                    <>Kembali</>
                  ) : (
                    <>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Kembali
                    </>
                  )}
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-11 bg-env-base hover:bg-env-dark text-white font-medium text-base"
                  disabled={isLoadingOtp || isLoadingEmail}
                >
                  {isLoadingOtp ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifikasi...
                    </>
                  ) : (
                    <>
                      Lanjut
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        );

      case 3:
        return (
          <form onSubmit={handleDetailsSubmit}>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-sm font-medium text-gray-700"
                >
                  Nama
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Masukkan nama lengkap"
                    className="h-11 pl-10 placeholder:text-sm border-gray-300 focus:ring-2 focus:ring-env-base"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      setFormErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                    disabled={isLoadingDetails}
                  />
                </div>
                {formErrors.name && (
                  <p className="text-sm text-destructive">{formErrors.name}</p>
                )}
              </div>
              <div className="flex justify-between gap-2">
                <div className="space-y-2 w-full">
                  <Label
                    htmlFor="nimOrNip"
                    className="text-sm font-medium text-gray-700"
                  >
                    {role === "LECTURER" ? "NIP" : "NIM"}
                  </Label>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="nimOrNip"
                      type="text"
                      placeholder={`Masukkan ${
                        role === "LECTURER" ? "NIP" : "NIM"
                      }`}
                      className="h-11 pl-10 placeholder:text-sm border-gray-300 focus:ring-2 focus:ring-env-base pr-10"
                      value={role === "LECTURER" ? formData.nip : formData.nim}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          [role === "LECTURER" ? "nip" : "nim"]: e.target.value,
                        });
                        setFormErrors((prev) => ({
                          ...prev,
                          nim: undefined,
                          nip: undefined,
                        }));
                      }}
                      disabled={isLoadingDetails}
                    />
                  </div>
                  {(formErrors.nim || formErrors.nip) && (
                    <p className="text-sm text-destructive">
                      {formErrors.nim || formErrors.nip}
                    </p>
                  )}
                </div>
                <div className="space-y-2 w-full">
                  <Label
                    htmlFor="phoneNumber"
                    className="text-sm font-medium text-gray-700"
                  >
                    Nomor HP
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="Masukkan nomor HP (08xx)"
                      className="h-11 pl-10 placeholder:text-sm border-gray-300 focus:ring-2 focus:ring-env-base pr-10"
                      value={formData.phoneNumber}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          phoneNumber: e.target.value,
                        });
                        setFormErrors((prev) => ({
                          ...prev,
                          phoneNumber: undefined,
                        }));
                      }}
                      disabled={isLoadingDetails}
                    />
                  </div>
                  {formErrors.phoneNumber && (
                    <p className="text-sm text-destructive">
                      {formErrors.phoneNumber}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex justify-between gap-2">
                <div className="space-y-2 w-full">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-gray-700"
                  >
                    Kata Sandi
                  </Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Buat kata sandi"
                      className="h-11 pl-10 pr-10 placeholder:text-sm border-gray-300 focus:ring-2 focus:ring-env-base"
                      value={formData.password}
                      onChange={(e) => {
                        setFormData({ ...formData, password: e.target.value });
                        setFormErrors((prev) => ({
                          ...prev,
                          password: undefined,
                        }));
                      }}
                      disabled={isLoadingDetails}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOffIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {formErrors.password && (
                    <p className="text-sm text-destructive">
                      {formErrors.password}
                    </p>
                  )}
                </div>
                <div className="space-y-2 w-full">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium text-gray-700"
                  >
                    Konfirmasi Kata Sandi
                  </Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Masukkan ulang kata sandi"
                      className="h-11 pl-10 pr-10 placeholder:text-sm border-gray-300 focus:ring-2 focus:ring-env-base"
                      value={formData.confirmPassword}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        });
                        setFormErrors((prev) => ({
                          ...prev,
                          confirmPassword: undefined,
                        }));
                      }}
                      disabled={isLoadingDetails}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOffIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {formErrors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {formErrors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex justify-center">
                <div className="space-y-2 flex flex-col items-center">
                  <Label
                    htmlFor="profilePicture"
                    className="text-sm font-medium text-gray-700 text-center"
                  >
                    Foto Profil
                  </Label>
                  <div className="flex flex-col justify-center items-center gap-4">
                    <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-300">
                      {profilePicturePreview ? (
                        <img
                          src={profilePicturePreview}
                          alt="Profile preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <Label
                        htmlFor="profilePicture"
                        className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-env-base focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 bg-white hover:bg-gray-50 hover:text-gray-700 h-11 px-4 py-2"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {profilePicture ? "Ganti Foto" : "Unggah Foto"}
                        <input
                          id="profilePicture"
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={handleProfilePictureChange}
                          disabled={isLoadingDetails}
                        />
                      </Label>
                      <p className="text-xs text-gray-600 mt-1 text-center">
                        JPG, PNG, maks 2MB
                      </p>
                    </div>
                  </div>
                </div>
                {formErrors.profilePicture && (
                  <p className="text-sm text-destructive">
                    {formErrors.profilePicture}
                  </p>
                )}
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 border-gray-300 text-gray-700 hover:bg-gray-50"
                  onClick={() => setCurrentStep(2)}
                  disabled={isLoadingDetails}
                >
                  {isLoadingDetails ? (
                    <>Kembali</>
                  ) : (
                    <>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Kembali
                    </>
                  )}
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-11 bg-env-base hover:bg-env-dark text-white font-medium text-base"
                  disabled={isLoadingDetails}
                >
                  {isLoadingDetails ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mendaftar...
                    </>
                  ) : (
                    "Daftar"
                  )}
                </Button>
              </div>
            </div>
          </form>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2 bg-white">
      {/* Left Column - Register Form */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl space-y-8">
          <div className="text-center">
            <div className="flex flex-col items-center gap-1 mb-6">
              <h2 className="text-4xl font-black tracking-tight text-env-base font-heading">
                Daftar Akun Baru
              </h2>
              <p className="text-sm text-env-dark">
                Buat akun untuk mengakses aplikasi Latest
              </p>
            </div>
          </div>
          <Card className="border-0 shadow-none">
            <CardContent className="space-y-6 p-0">
              <div className="flex justify-center">
                <Stepper
                  steps={steps}
                  currentStep={currentStep}
                  className="mb-6"
                />
              </div>
              {renderStepContent()}
            </CardContent>
            <div className="text-center text-sm text-gray-600">
              Sudah punya akun?{" "}
              <Link
                to="/login"
                className="font-medium text-env-base hover:text-env-light"
              >
                Login di sini
              </Link>
            </div>
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
            <h3 className="text-2xl font-bold">Bergabung dengan LATEST</h3>
            <p className="text-lg text-blue-100">
              Daftar sekarang untuk mengelola tugas akhir Teknik Lingkungan
              dengan mudah dan efisien.
            </p>
          </div>
        </div>
        <div className="absolute top-10 right-10 w-32 h-32 bg-white/5 rounded-full blur-xl" />
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-white/5 rounded-full blur-xl" />
        <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-white/10 rounded-full blur-lg" />
      </div>
    </div>
  );
};

export default Register;
