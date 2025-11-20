"use client"

import { Navbar } from "@/components/navbar"
import { ArrowLeft } from "lucide-react"

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-16">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Cookie Policy</h1>
          <p className="text-gray-600">Last updated: January 2025</p>
        </div>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold mb-4 text-black">What Are Cookies?</h2>
            <p>
              Cookies are small text files that websites store on your device. They help websites remember information
              about your visit, like your login status and preferences. Think of them as little notes that help us
              recognize you when you come back.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-black">How We Use Cookies</h2>
            <p className="mb-4">We use cookies to make MySeatMap work better for you. Here&apos;s what we use them for:</p>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold mb-2 text-black">Essential Cookies</h3>
                <p>
                  These are necessary for the website to function. They keep you logged in, remember your session, and
                  help the site work properly. Without these, MySeatMap wouldn&apos;t work. You can&apos;t disable these because
                  they&apos;re required for basic functionality.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-2 text-black">Preference Cookies</h3>
                <p>
                  These remember your choices, like your preferred language or display settings. They make your
                  experience more personalized and save you from having to set your preferences every time.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-2 text-black">Analytics Cookies</h3>
                <p>
                  We use these to understand how people use MySeatMap. They tell us things like which features are
                  popular, where people get stuck, and how we can improve. This data is anonymized and helps us make the
                  service better for everyone.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-black">What We Don&apos;t Do</h2>
            <p>
              We don&apos;t use cookies for advertising or tracking you across other websites. We&apos;re not building a profile
              to sell to advertisers. The cookies we use are focused on making MySeatMap work well for you, not
              monetizing your data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-black">Third-Party Cookies</h2>
            <p>
              Some services we use, like payment processors and analytics tools, may set their own cookies. These are
              governed by their respective privacy policies. We only work with trusted partners who respect your
              privacy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-black">Managing Cookies</h2>
            <p className="mb-4">You have control over cookies. Here&apos;s how to manage them:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Browser Settings:</strong> Most browsers let you block or delete cookies. Check your browser&apos;s
                help section for instructions.
              </li>
              <li>
                <strong>Essential Cookies:</strong> If you block essential cookies, some parts of MySeatMap won&apos;t work
                properly.
              </li>
              <li>
                <strong>Analytics Cookies:</strong> You can opt out of analytics cookies, though it helps us improve the
                service if you allow them.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-black">Cookie Lifespan</h2>
            <p>
              Some cookies expire when you close your browser (session cookies), while others stay on your device for a
              set period (persistent cookies). We use both types depending on what&apos;s needed. For example, login cookies
              persist so you don&apos;t have to sign in every time, while some preference cookies expire after your session
              ends.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-black">Updates to This Policy</h2>
            <p>
              We may update this cookie policy from time to time. If we make significant changes, we&apos;ll let you know.
              The &quot;Last updated&quot; date at the top shows when we last made changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-black">Questions?</h2>
            <p>
              If you have questions about how we use cookies, email us at{" "}
              <a href="mailto:privacy@myseatmap.com" className="text-black underline hover:text-gray-700">
                privacy@myseatmap.com
              </a>
              . We&apos;re happy to explain.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
