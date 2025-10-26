import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { FloatingHeader } from "@/components/floating-header";
import { createClient } from "@/lib/server";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Utopia Hire",
  description: "A platform for hiring top talent",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Fetch user profile picture if user is authenticated
  let profilePicture = null;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('profile_picture')
      .eq('id', user.id)
      .single();
    
    profilePicture = profile?.profile_picture;
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <FloatingHeader userEmail={user?.email} profilePicture={profilePicture} />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
