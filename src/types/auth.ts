export interface RegisterEmailRequest {
  email: string;
}

export interface RegisterEmailResponse {
  message: string;
}

export interface VerifyOtpRequest {
  email: string;
  code: number;
}

export interface VerifyOtpResponse {
  message: string;
}

export interface RegisterUserRequest {
  email: string;
  name: string;
  nim?: string;
  nip?: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterUserResponse {
  message: string;
  user: {
    id: number;
    email: string;
    role: "STUDENT" | "LECTURER";
    name: string;
    profilePicture?: string;
  };
}

export interface User {
  id: number;
  email: string;
  role: "STUDENT" | "LECTURER" | "COORDINATOR";
  profile: {
    name: string;
    profilePicture?: string;
    nim?: string;
    nip?: string;
  } | null;
}
