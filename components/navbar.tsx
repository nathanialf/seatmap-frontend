"use client"

import Link from "next/link"
import { Menu, X, User, Settings, LogOut } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useRouter } from 'next/navigation'
import { useState } from "react"
import Image from "next/image"
import { useAuth } from "@/hooks/useAuth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Navbar() {
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { isUser, signOut, isLoading } = useAuth()

  const handleLogoClick = () => {
    if (isUser) {
      router.push("/dashboard")
    } else {
      router.push("/")
    }
    router.refresh()
  }

  const handleMobileNavClick = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      <header className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center space-x-8">
          <button onClick={handleLogoClick} className="flex items-center cursor-pointer">
            <Image src="/logo.svg" alt="MySeatMap" width={150} height={40} className="h-8 w-auto" priority />
          </button>
          <nav className="hidden md:flex space-x-6 text-sm">
            <Link href="/search" className="hover:text-gray-900">
              Search Flights
            </Link>
            <Link href="/dashboard" className="hover:text-gray-900">
              Dashboard
            </Link>
            <Link href="/pricing" className="hover:text-gray-900">
              Pricing
            </Link>
          </nav>
        </div>
        <div className="hidden md:flex items-center space-x-4">
          {!isLoading && (
            <>
              {isUser ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="cursor-pointer relative w-10 h-10 rounded-full border-2 !border-teal-500 hover:!bg-teal-500 hover:!border-teal-500 transition-colors"
                    >
                      <User className="w-5 h-5" />
                      <span className="sr-only">Profile menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      My Account
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/dashboard')} className="cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/profile')} className="cursor-pointer">
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="cursor-pointer text-red-600">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
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
                </>
              )}
            </>
          )}
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
            <Link href="/search" className="text-gray-700 hover:text-gray-900 py-2" onClick={handleMobileNavClick}>
              Search Flights
            </Link>
            <Link href="/dashboard" className="text-gray-700 hover:text-gray-900 py-2" onClick={handleMobileNavClick}>
              Dashboard
            </Link>
            <Link href="/pricing" className="text-gray-700 hover:text-gray-900 py-2" onClick={handleMobileNavClick}>
              Pricing
            </Link>
            <div className="border-t border-gray-200 pt-4 space-y-3">
              {!isLoading && (
                <>
                  {isUser ? (
                    <>
                      <div className="px-2 py-2 text-sm font-medium text-gray-700">
                        My Account
                      </div>
                      <Link href="/dashboard" onClick={handleMobileNavClick}>
                        <Button variant="ghost" className="w-full text-sm justify-start cursor-pointer border-2 !border-teal-500 hover:!bg-teal-500 hover:!border-teal-500 transition-colors">
                          <Settings className="w-4 h-4 mr-2" />
                          Dashboard
                        </Button>
                      </Link>
                      <Link href="/profile" onClick={handleMobileNavClick}>
                        <Button variant="ghost" className="w-full text-sm justify-start cursor-pointer border-2 !border-teal-500 hover:!bg-teal-500 hover:!border-teal-500 transition-colors">
                          <User className="w-4 h-4 mr-2" />
                          Profile
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        className="w-full text-sm text-red-600 justify-start cursor-pointer" 
                        onClick={() => {
                          handleMobileNavClick()
                          signOut()
                        }}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  )
}
