import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { GoogleOAuthProvider } from "@react-oauth/google";

const inter = Inter({
    subsets: ["latin"],
    display: "swap",
});

export const metadata: Metadata = {
    title: "AI Interview Platform | Adaptive Technical Interviews",
    description:
        "AI-powered adaptive interview engine that dynamically adjusts questions based on your performance. Practice interviews, analyze resumes, and track your growth.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={inter.className}>
            <body>
                <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
                    <AuthProvider>
                        <Navbar />
                        <main style={{ paddingTop: "72px", minHeight: "100vh" }}>
                            {children}
                        </main>
                    </AuthProvider>
                </GoogleOAuthProvider>
            </body>
        </html>
    );
}
