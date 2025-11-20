"use client"

import { Navbar } from "@/components/navbar"
import { Plane, Users, Heart, ArrowLeft } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-6 pt-8 pb-2 mb-6">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        </div>

        {/* Hero Section */}
        <section className="py-8 px-6 text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Built for travelers, by travelers</h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            We know what it&apos;s like to refresh airline websites dozens of times, hoping for a better seat. We&apos;ve been
            there, and we built MySeatMap to make that experience better for everyone.
          </p>
        </section>

        {/* Story Section */}
        <section className="py-12 px-6 bg-gray-50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Our Story</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                MySeatMap started in a small apartment in San Francisco, born from a simple frustration: missing out on
                better seats because we didn&apos;t check at the right time. We were tired of constantly refreshing airline
                websites, hoping that window seat or extra legroom would become available.
              </p>
              <p>
                We talked to frequent flyers, airline staff, and travel enthusiasts. Everyone had the same story—they&apos;d
                either given up on getting better seats or spent way too much time checking manually. We knew there had
                to be a better way.
              </p>
              <p>
                So we built MySeatMap. Not as a faceless tech company, but as fellow travelers who genuinely care about
                making flights more comfortable. We wanted to create something that felt like having a friend who&apos;d tap
                you on the shoulder and say, &quot;Hey, that seat you wanted just opened up.&quot;
              </p>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center">What Drives Us</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">Built with Care</h3>
                <p className="text-gray-600">
                  Every feature we build is tested by real travelers. We don&apos;t ship anything we wouldn&apos;t use ourselves
                  on our own flights.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">For Everyone</h3>
                <p className="text-gray-600">
                  Whether you&apos;re a business traveler, a family on vacation, or airline crew trying to get home, we&apos;re
                  here to help you fly more comfortably.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plane className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">Always Improving</h3>
                <p className="text-gray-600">
                  We listen to feedback from our community and constantly work to make MySeatMap better, faster, and
                  more helpful.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-12 px-6 bg-gray-50">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">A Small Team with Big Dreams</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              We&apos;re a small, dedicated team based in San Francisco. Some of us are frequent flyers, others have worked
              in the airline industry, and all of us are passionate about making travel better. We believe the best
              products come from people who truly understand and care about the problems they&apos;re solving.
            </p>
            <p className="text-gray-700 leading-relaxed">
              When you use MySeatMap, you&apos;re not just using a tool—you&apos;re joining a community of travelers who believe
              that everyone deserves a comfortable flight, and that technology should work for people, not the other way
              around.
            </p>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-6 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Ready to fly better?</h2>
            <p className="text-gray-600 mb-8">Join thousands of travelers who never miss out on better seats.</p>
            <a
              href="/search"
              className="inline-block bg-black text-white hover:bg-gray-800 rounded-full px-8 py-3 font-medium transition-colors"
            >
              Start Tracking Seats
            </a>
          </div>
        </section>
      </main>
    </div>
  )
}
