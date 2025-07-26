"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { LayoutGrid, ListVideo, History, Menu, X } from "lucide-react"
import { useState } from "react"
import { Button } from "./ui/button"

const navItems = [
  { name: "Curate", href: "/curate", icon: LayoutGrid },
  { name: "Queue", href: "/queue", icon: ListVideo },
  { name: "Logs", href: "/logs", icon: History },
]

export default function Header() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-lg border-b border-gold/20">
      <div className="container mx-auto flex items-center justify-between h-20 px-4">
        <Link href="/curate" className="flex items-center gap-2">
          <img src="/placeholder-logo.svg" alt="BikesVsCops Logo" className="h-8 w-8" />
          <span className="text-xl font-bold text-white">
            Bikes<span className="text-gold">Vs</span>Cops
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                  isActive ? "text-gold" : "text-gray-300 hover:text-white"
                }`}
              >
                {item.name}
                {isActive && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold"
                    layoutId="underline"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="h-6 w-6 text-white" /> : <Menu className="h-6 w-6 text-white" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="md:hidden bg-black/80 backdrop-blur-xl border-t border-gold/20"
        >
          <nav className="flex flex-col items-center gap-4 py-4">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2 text-lg font-medium transition-colors w-full text-center justify-center ${
                  pathname === item.href ? "text-gold bg-gold/10" : "text-gray-300 hover:text-white"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>
        </motion.div>
      )}
    </header>
  )
}
