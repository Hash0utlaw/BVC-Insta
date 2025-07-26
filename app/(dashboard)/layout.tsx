import type React from "react"
import Header from "@/components/header"
import MotionWrapper from "@/components/motion-wrapper"
import { Toaster } from "@/components/ui/sonner"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen w-full text-white">
      <div
        className="fixed inset-0 z-[-1] h-full w-full bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/motorcycle-night-bg.png')" }}
      />
      <div className="fixed inset-0 z-[-1] h-full w-full bg-black/60 backdrop-blur-sm" />

      <Header />
      <main className="pt-20">
        <MotionWrapper>{children}</MotionWrapper>
      </main>
      <Toaster theme="dark" richColors />
    </div>
  )
}
