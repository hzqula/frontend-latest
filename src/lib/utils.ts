import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { AxiosError } from "axios";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const handleError = (error: unknown): string => {
  console.log("Error:", error);

  if (error instanceof AxiosError) {
    if (error.response) {
      return error.response.data.error || "Terjadi kesalahan pada server";
    } else if (error.request) {
      return "Tidak ada respons dari server";
    } else {
      return `Kesalahan konfigurasi: ${error.message}`;
    }
  } else if (error instanceof Error) {
    return error.message;
  }
  return "Terjadi kesalahan yang tidak diketahui";
};
