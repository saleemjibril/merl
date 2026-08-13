import "../styles/index.scss";
import { Poppins } from "next/font/google";
import { Toast } from "./toast";
import { AuthProvider } from "../lib/auth-context";

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: {
    default: "MERL",
    template: "%s | MERL",
  },
  description:
    "Monitor and evaluate your projects — indicators, evidence, deadlines, and donor-ready reports.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={poppins.variable}>
      <body>
        <AuthProvider>
          <Toast />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
