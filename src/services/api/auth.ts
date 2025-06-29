import api from "../../lib/axios";
import {
  RegisterEmailRequest,
  RegisterEmailResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  RegisterUserRequest,
  RegisterUserResponse,
} from "../../types/auth";

export const registerEmail = async (
  data: RegisterEmailRequest
): Promise<RegisterEmailResponse> => {
  const response = await api.post<RegisterEmailResponse>(
    "/auth/register/email",
    data
  );
  return response.data;
};

export const verifyOtp = async (
  data: VerifyOtpRequest
): Promise<VerifyOtpResponse> => {
  const response = await api.post<VerifyOtpResponse>(
    "/auth/register/verify-otp",
    data
  );
  return response.data;
};

export const registerUser = async (
  data: RegisterUserRequest,
  file?: File
): Promise<RegisterUserResponse> => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      formData.append(key, value.toString());
    }
  });
  if (file) {
    formData.append("profilePicture", file);
  }

  const response = await api.post<RegisterUserResponse>(
    "/auth/register/user",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return response.data;
};
