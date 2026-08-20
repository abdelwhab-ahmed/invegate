import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";
import SplashScreen from "./components/SplashScreen";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-heading",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-body",
});

export const metadata = {
  title: "Invegate",
  description: "Browse curated land listings across Egypt.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SplashScreen>
          {children}
        </SplashScreen>
      </body>
    </html>
  );
}