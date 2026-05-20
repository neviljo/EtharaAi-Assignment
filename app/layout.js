import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "Aetheria Tasks | Team Task Manager",
  description: "A premium, full-stack collaborative project and task workspace for modern teams.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-[#0a0c10] text-[#f3f4f6] antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
