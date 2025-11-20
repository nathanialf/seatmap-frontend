"use client"

import Link from "next/link"
import { Menu, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useRouter } from 'next/navigation'
import { useState } from "react"
import Image from "next/image"

export function Navbar() {
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleHomeClick = () => {
    router.push("/")
    router.refresh()
  }

  const handleMobileNavClick = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      <header className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center space-x-8">
          <Link href="/" onClick={handleHomeClick} className="flex items-center">
            <Image src="/logo.svg" alt="MySeatMap" width={150} height={40} className="h-8 w-auto" priority />
          </Link>
          <nav className="hidden md:flex space-x-6 text-sm">
            <Link href="/" className="hover:text-gray-900">
              Home
            </Link>
            <Link href="/search" className="hover:text-gray-900">
              Search Flights
            </Link>
            <Link href="/pricing" className="hover:text-gray-900">
              Pricing
            </Link>
            <Link href="/dashboard" className="hover:text-gray-900">
              Dashboard
            </Link>
          </nav>
        </div>
        <div className="hidden md:flex items-center space-x-4">
          <Link href="/auth/signin">
            <Button variant="ghost" className="text-sm cursor-pointer">
              Sign In
            </Button>
          </Link>
          <Link href="/auth/signup">
            <Button className="text-sm bg-black text-white hover:bg-gray-800 rounded-full cursor-pointer">
              Sign Up
            </Button>
          </Link>
        </div>
        <button
          className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <nav className="flex flex-col px-6 py-4 space-y-4">
            <Link href="/" className="text-gray-700 hover:text-gray-900 py-2" onClick={handleMobileNavClick}>
              Home
            </Link>
            <Link href="/search" className="text-gray-700 hover:text-gray-900 py-2" onClick={handleMobileNavClick}>
              Search Flights
            </Link>
            <Link href="/pricing" className="text-gray-700 hover:text-gray-900 py-2" onClick={handleMobileNavClick}>
              Pricing
            </Link>
            <Link href="/dashboard" className="text-gray-700 hover:text-gray-900 py-2" onClick={handleMobileNavClick}>
              Dashboard
            </Link>
            <div className="border-t border-gray-200 pt-4 space-y-3">
              <Link href="/auth/signin" onClick={handleMobileNavClick}>
                <Button variant="ghost" className="w-full text-sm cursor-pointer">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup" onClick={handleMobileNavClick}>
                <Button className="w-full bg-black text-white hover:bg-gray-800 text-sm rounded-full cursor-pointer">
                  Get Started
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  )
}
