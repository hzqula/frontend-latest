import { toast } from "sonner";

export const toaster = {
  success: (message: string) => {
    toast.success(message, {
      className: "bg-green-500 text-white border-green-600",
      duration: 3000,
    });
  },
  error: (message: string) => {
    toast.error(message, {
      className: "bg-red-500 text-white border-red-600",
      duration: 5000,
    });
  },
  info: (message: string) => {
    toast.info(message, {
      className: "bg-blue-500 text-white border-blue-600",
      duration: 3000,
    });
  },
};
