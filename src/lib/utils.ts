import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { AxiosError } from "axios";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const handleError = (error: unknown): string => {
  if (error instanceof AxiosError) {
    // Error dari axios
    if (error.response) {
      return error.response.data?.message || "Terjadi kesalahan pada server";
    } else if (error.request) {
      return "Tidak ada respons dari server";
    } else {
      return `Kesalahan konfigurasi: ${error.message}`;
    }
  } else if (error instanceof Error) {
    // Error biasa
    return error.message;
  }
  // Default untuk error yang tidak diketahui
  return "Terjadi kesalahan yang tidak diketahui";
};
