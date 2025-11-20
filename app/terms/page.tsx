"use client"

import { Navbar } from "@/components/navbar"
import { ArrowLeft } from "lucide-react"

export default function TermsPage() {
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
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-gray-600">Last updated: January 2025</p>
        </div>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold mb-4 text-black">The Basics</h2>
            <p>
              Welcome to MySeatMap. By using our service, you&apos;re agreeing to these terms. We&apos;ve tried to keep them
              straightforward and fair. If something doesn&apos;t make sense, reach out to us at{" "}
              <a href="mailto:hello@myseatmap.com" className="text-black underline hover:text-gray-700">
                hello@myseatmap.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-black">What MySeatMap Does</h2>
            <p>
              MySeatMap helps you view airplane seat maps and track seat availability. We pull data from various sources
              to show you what seats are available on flights. We do our best to keep this information accurate and
              up-to-date, but we can&apos;t guarantee it&apos;s always perfect. Airlines change things, and sometimes there&apos;s a
              delay in updates.
            </p>
            <p className="mt-4">
              Important: We&apos;re a seat map viewing tool, not a booking platform. We don&apos;t sell tickets or reserve seats.
              You&apos;ll need to book through the airline or your preferred booking site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-black">Your Account</h2>
            <p className="mb-4">To use MySeatMap, you need to create an account. Here&apos;s what we expect:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate information when signing up</li>
              <li>Keep your password secure and don&apos;t share your account</li>
              <li>Let us know if you notice any unauthorized use of your account</li>
              <li>You must be at least 13 years old to use our service</li>
            </ul>
            <p className="mt-4">
              You&apos;re responsible for everything that happens under your account, so keep it secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-black">Acceptable Use</h2>
            <p className="mb-4">Please use MySeatMap responsibly. Don&apos;t:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Try to hack, scrape, or reverse engineer our service</li>
              <li>Use automated tools to access our platform without permission</li>
              <li>Share your account with others or resell access</li>
              <li>Use the service for anything illegal or harmful</li>
              <li>Overload our systems with excessive requests</li>
            </ul>
            <p className="mt-4">
              Basically, be a good person. If we notice misuse, we may suspend or terminate your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-black">Pricing and Payments</h2>
            <p>
              We offer both free and paid plans. Paid plans are billed monthly or annually, depending on what you
              choose. If you upgrade to a paid plan:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>You&apos;ll be charged at the start of each billing period</li>
              <li>Payments are processed securely through Stripe</li>
              <li>You can cancel anytime, but we don&apos;t offer refunds for partial months</li>
              <li>We may change our pricing, but we&apos;ll give you advance notice</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-black">Cancellation</h2>
            <p>
              You can cancel your subscription anytime from your account settings. When you cancel, you&apos;ll keep access
              until the end of your current billing period. After that, your account will revert to the free plan. If
              you want to delete your account entirely, you can do that too.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-black">Data Accuracy</h2>
            <p>
              We work hard to provide accurate seat map information, but we can&apos;t guarantee it&apos;s always 100% correct.
              Airlines change configurations, seats get blocked or unblocked, and sometimes there are delays in data
              updates. Always verify seat availability directly with the airline before making booking decisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-black">Intellectual Property</h2>
            <p>
              MySeatMap and all its content, features, and functionality are owned by us and protected by copyright and
              other laws. You can use our service, but you can&apos;t copy, modify, or distribute our code, design, or
              content without permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-black">Disclaimers</h2>
            <p>
              MySeatMap is provided &quot;as is&quot; without warranties of any kind. We don&apos;t guarantee that the service will
              always be available, error-free, or meet your specific needs. We&apos;re not liable for any issues that arise
              from using our service, including missed flights, booking problems, or inaccurate data.
            </p>
            <p className="mt-4">
              Use MySeatMap as a helpful tool, but always verify important information with the airline.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-black">Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, MySeatMap and its team won&apos;t be liable for any indirect,
              incidental, or consequential damages arising from your use of the service. Our total liability is limited
              to the amount you paid us in the past 12 months.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-black">Changes to These Terms</h2>
            <p>
              We may update these terms from time to time. If we make significant changes, we&apos;ll notify you via email or
              a notice on our website. Continuing to use MySeatMap after changes means you accept the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-black">Contact Us</h2>
            <p>
              Questions about these terms? Reach out to us at{" "}
              <a href="mailto:hello@myseatmap.com" className="text-black underline hover:text-gray-700">
                hello@myseatmap.com
              </a>
              . We&apos;re here to help.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
