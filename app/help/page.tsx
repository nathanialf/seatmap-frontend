"use client"

import { Navbar } from "@/components/navbar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, MessageCircle, Book, CreditCard, Bell, Shield, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function HelpCenterPage() {
  const helpCategories = [
    {
      icon: Book,
      title: "Getting Started",
      description: "Learn the basics of tracking flights and setting up alerts",
      link: "/faq#getting-started",
    },
    {
      icon: Bell,
      title: "Alerts & Notifications",
      description: "Manage how and when you receive seat availability updates",
      link: "/faq#alerts",
    },
    {
      icon: CreditCard,
      title: "Billing & Plans",
      description: "Questions about pricing, payments, and subscriptions",
      link: "/pricing",
    },
    {
      icon: Shield,
      title: "Privacy & Security",
      description: "How we protect your data and respect your privacy",
      link: "/privacy",
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-16">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 text-balance">How can we help you?</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto text-pretty mb-8">
            We&apos;re here to help you get the most out of MySeatMap. Browse our help topics or reach out directly.
          </p>

          {/* Search placeholder */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for help..."
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-full focus:outline-none focus:border-gray-400"
            />
          </div>
        </div>

        {/* Help Categories */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {helpCategories.map((category) => (
            <Link key={category.title} href={category.link}>
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                <category.icon className="w-8 h-8 mb-4" />
                <h3 className="text-xl font-bold mb-2">{category.title}</h3>
                <p className="text-gray-600">{category.description}</p>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Links */}
        <div className="bg-gray-50 rounded-2xl p-8 mb-16">
          <h2 className="text-2xl font-bold mb-6 text-center">Popular Help Articles</h2>
          <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            <Link href="/faq#how-it-works" className="text-gray-700 hover:text-gray-900 hover:underline">
              → How does seat tracking work?
            </Link>
            <Link href="/faq#notifications" className="text-gray-700 hover:text-gray-900 hover:underline">
              → Setting up notifications
            </Link>
            <Link href="/faq#airlines" className="text-gray-700 hover:text-gray-900 hover:underline">
              → Which airlines are supported?
            </Link>
            <Link href="/faq#account" className="text-gray-700 hover:text-gray-900 hover:underline">
              → Managing your account
            </Link>
            <Link href="/faq#pricing" className="text-gray-700 hover:text-gray-900 hover:underline">
              → Understanding pricing plans
            </Link>
            <Link href="/faq#cancellation" className="text-gray-700 hover:text-gray-900 hover:underline">
              → Cancellation policy
            </Link>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="text-center bg-white border-2 border-gray-200 rounded-2xl p-12">
          <MessageCircle className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Still need help?</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Can&apos;t find what you&apos;re looking for? Our team is here to help. We typically respond within a few hours.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/contact">
              <Button className="bg-black text-white hover:bg-gray-800 rounded-full px-8 cursor-pointer">
                Contact Support
              </Button>
            </Link>
            <Link href="/faq">
              <Button className="bg-transparent border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-100 text-black rounded-full px-8 cursor-pointer">
                View All FAQs
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
