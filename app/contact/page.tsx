"use client"

import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Mail, MessageSquare, MapPin, ArrowLeft } from "lucide-react"

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-16">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-balance">Get in Touch</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto text-pretty">
            Have a question, suggestion, or just want to say hi? We&apos;d love to hear from you. Real people read every
            message that comes through.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Contact Info Cards */}
          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-gray-700" />
            </div>
            <h3 className="font-bold mb-2">Email Us</h3>
            <p className="text-sm text-gray-600">hello@myseatmap.com</p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-6 h-6 text-gray-700" />
            </div>
            <h3 className="font-bold mb-2">Response Time</h3>
            <p className="text-sm text-gray-600">Usually within 24 hours</p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-6 h-6 text-gray-700" />
            </div>
            <h3 className="font-bold mb-2">Location</h3>
            <p className="text-sm text-gray-600">San Francisco, CA</p>
          </Card>
        </div>

        {/* Contact Form */}
        <Card className="p-8">
          <h2 className="text-2xl font-bold mb-6">Send us a message</h2>
          <form className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Your Name
                </label>
                <Input id="name" placeholder="John Doe" className="rounded-full" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email Address
                </label>
                <Input id="email" type="email" placeholder="john@example.com" className="rounded-full" />
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium mb-2">
                Subject
              </label>
              <Input id="subject" placeholder="What's this about?" className="rounded-full" />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-2">
                Message
              </label>
              <Textarea id="message" placeholder="Tell us what's on your mind..." rows={6} className="resize-none" />
            </div>

            <Button type="submit" className="w-full md:w-auto bg-black text-white hover:bg-gray-800 rounded-full px-8">
              Send Message
            </Button>
          </form>
        </Card>

        {/* Additional Info */}
        <div className="mt-12 text-center text-sm text-gray-600">
          <p className="text-pretty">
            Whether you&apos;re a frequent flyer with feedback, an airline professional with insights, or someone who just
            discovered us and wants to chat—we&apos;re here for it. Every email gets read by our team, not a bot.
          </p>
        </div>
      </main>
    </div>
  )
}
