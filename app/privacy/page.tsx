"use client"

import { Navbar } from "@/components/navbar"
import { ArrowLeft } from "lucide-react"

export default function PrivacyPage() {
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
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-gray-600">Last updated: January 2025</p>
        </div>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold mb-4 text-black">The Short Version</h2>
            <p>
              We collect only what we need to make MySeatMap work for you. We don&apos;t sell your data to anyone, ever. We
              use industry-standard security to keep your information safe. You can delete your account anytime.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-black">What We Collect</h2>
            <p className="mb-4">
              When you use MySeatMap, we collect information that helps us provide and improve our service:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Account Information:</strong> Your email address and password when you sign up
              </li>
              <li>
                <strong>Flight Searches:</strong> The flights you search for and seat maps you view
              </li>
              <li>
                <strong>Usage Data:</strong> How you interact with our service to help us make it better
              </li>
              <li>
                <strong>Payment Information:</strong> If you subscribe to a paid plan, we use Stripe to process payments
                securely
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-black">How We Use Your Information</h2>
            <p className="mb-4">We use your information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide you with seat map information for your flights</li>
              <li>Send you notifications about seat availability changes</li>
              <li>Improve our service and fix bugs</li>
              <li>Communicate with you about your account or our service</li>
              <li>Prevent fraud and keep our platform secure</li>
            </ul>
            <p className="mt-4">
              We don&apos;t use your data for advertising or sell it to third parties. Your flight searches are your
              business, not ours to monetize.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-black">Data Sharing</h2>
            <p className="mb-4">We share your information only when necessary:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Service Providers:</strong> We work with companies like Stripe for payments and cloud hosting
                providers to run our service
              </li>
              <li>
                <strong>Legal Requirements:</strong> If required by law or to protect our rights and users
              </li>
              <li>
                <strong>With Your Consent:</strong> When you explicitly agree to share information
              </li>
            </ul>
            <p className="mt-4">That&apos;s it. We don&apos;t have a long list of data brokers or advertising partners.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-black">Your Rights</h2>
            <p className="mb-4">You have control over your data:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Access:</strong> You can view all the data we have about you
              </li>
              <li>
                <strong>Correction:</strong> Update your information anytime in your account settings
              </li>
              <li>
                <strong>Deletion:</strong> Delete your account and we&apos;ll remove your data within 30 days
              </li>
              <li>
                <strong>Export:</strong> Download your data in a portable format
              </li>
            </ul>
            <p className="mt-4">
              To exercise these rights, just email us at privacy@myseatmap.com or use your account settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-black">Security</h2>
            <p>
              We take security seriously. Your data is encrypted in transit and at rest. We use industry-standard
              practices to protect your information. While no system is 100% secure, we do our best to keep your data
              safe and regularly review our security measures.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-black">Cookies</h2>
            <p>
              We use cookies to keep you logged in and remember your preferences. That&apos;s about it. Check our{" "}
              <a href="/cookies" className="text-black underline hover:text-gray-700">
                Cookie Policy
              </a>{" "}
              for more details.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-black">Changes to This Policy</h2>
            <p>
              We may update this policy from time to time. If we make significant changes, we&apos;ll let you know via email
              or a notice on our website. The &quot;Last updated&quot; date at the top shows when we last made changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-black">Questions?</h2>
            <p>
              If you have questions about this privacy policy or how we handle your data, reach out to us at{" "}
              <a href="mailto:privacy@myseatmap.com" className="text-black underline hover:text-gray-700">
                privacy@myseatmap.com
              </a>
              . We&apos;re real people and we&apos;ll get back to you.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
