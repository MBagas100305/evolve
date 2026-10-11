import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { AssumptionsProvider } from "@/components/Assumptions";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata = {
  title: {
    default: "RES NEXUS | EVOLVE",
    template: "%s | EVOLVE",
  },
  description:
    "RES NEXUS: the route management dashboard for PT RES's electric angkot scale-up. Energy control, battery lifecycle, route economics and driver income in one place.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body>
        <AssumptionsProvider>
          <div className="shell">
            <Sidebar />
            <main className="main">{children}</main>
          </div>
        </AssumptionsProvider>
      </body>
    </html>
  );
}
