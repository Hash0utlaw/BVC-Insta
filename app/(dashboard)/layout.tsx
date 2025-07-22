import type React from "react"
import Header from "@/components/header"
import { MotionWrapper } from "@/components/motion-wrapper"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      <div
        className="fixed inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/images/motorcycle-night-bg.png)" }}
      />
      <div className="fixed inset-0 z-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        <MotionWrapper>
          <main className="flex-grow container mx-auto p-4 md:p-6">{children}</main>
        </MotionWrapper>
      </div>
    </div>
  )
}
