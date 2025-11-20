"use client"

import { Navbar } from "@/components/navbar"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function FAQPage() {
  const router = useRouter()

  const faqSections = [
    {
      id: "getting-started",
      title: "Getting Started",
      questions: [
        {
          id: "how-it-works",
          question: "How does MySeatMap work?",
          answer:
            "MySeatMap monitors seat availability on your selected flights in real-time. When a seat becomes available that matches your preferences, we send you an instant notification. You can then quickly book that seat through your airline's website or app before someone else grabs it.",
        },
        {
          id: "setup",
          question: "How do I set up my first alert?",
          answer:
            'It\'s simple! Just search for your flight using the flight number or route, select the flight from the results, and click "Set Alert." You can customize which seats you want to track and how you want to be notified. The whole process takes less than a minute.',
        },
        {
          id: "airlines",
          question: "Which airlines are supported?",
          answer:
            "We support all major airlines including American, Delta, United, Southwest, and over 100 international carriers. If you have a specific airline in mind, feel free to reach out and we'll let you know if it's supported.",
        },
      ],
    },
    {
      id: "alerts",
      title: "Alerts & Notifications",
      questions: [
        {
          id: "speed",
          question: "How fast are the alerts?",
          answer:
            "Our system checks seat availability every 2-5 minutes and sends alerts within seconds of detecting a change. Speed is crucial when it comes to snagging the perfect seat, so we've built our system to be as fast as possible.",
        },
        {
          id: "notifications",
          question: "What types of notifications can I receive?",
          answer:
            "Depending on your plan, you can receive notifications via email, SMS, or push notifications. You can customize which types you want for each alert. Pro and Business users can enable multiple notification methods to make sure they never miss an update.",
        },
        {
          id: "multiple-flights",
          question: "Can I track multiple flights at once?",
          answer:
            "Yes! The number of flights you can track simultaneously depends on your plan. Free users can track 2 flights, Pro users can track 10, and Business users have unlimited tracking.",
        },
      ],
    },
    {
      id: "pricing",
      title: "Pricing & Billing",
      questions: [
        {
          id: "free-trial",
          question: "How does the free trial work?",
          answer:
            "All paid plans come with a 14-day free trial. No credit card required. You can cancel anytime during the trial period without being charged. We want you to try MySeatMap risk-free and see if it works for you.",
        },
        {
          id: "change-plans",
          question: "Can I change plans later?",
          answer:
            "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any charges. If you upgrade mid-month, you'll only pay the difference for the remaining days.",
        },
        {
          id: "payment-methods",
          question: "What payment methods do you accept?",
          answer:
            "We accept all major credit cards (Visa, Mastercard, American Express) and PayPal for Business plans. All payments are processed securely through Stripe.",
        },
        {
          id: "cancellation",
          question: "What's your cancellation policy?",
          answer:
            "You can cancel your subscription anytime from your account settings. There are no cancellation fees, and you'll continue to have access until the end of your billing period. We don't believe in making it hard to leave.",
        },
      ],
    },
    {
      id: "account",
      title: "Account & Settings",
      questions: [
        {
          id: "create-account",
          question: "Do I need an account to use MySeatMap?",
          answer:
            "Yes, you'll need to create a free account to track flights and receive alerts. This allows us to save your preferences and alert history. Sign up takes less than a minute with email or you can use Google or Apple sign-in.",
        },
        {
          id: "data-privacy",
          question: "How do you handle my data?",
          answer:
            "We take your privacy seriously. We only collect the information necessary to provide our service, and we never sell your data to third parties. You can read more in our Privacy Policy, but the short version is: your data is yours, and we protect it.",
        },
        {
          id: "delete-account",
          question: "Can I delete my account?",
          answer:
            "Yes, you can delete your account at any time from your account settings. This will permanently remove all your data from our systems. We'll be sad to see you go, but we respect your choice.",
        },
      ],
    },
    {
      id: "technical",
      title: "Technical Questions",
      questions: [
        {
          id: "mobile",
          question: "Is there a mobile app?",
          answer:
            "Currently, MySeatMap is a web application that works great on mobile browsers. We're working on native iOS and Android apps, which should be available later this year. In the meantime, you can add our website to your home screen for a app-like experience.",
        },
        {
          id: "accuracy",
          question: "How accurate is the seat availability data?",
          answer:
            "We pull data directly from airline systems, so our accuracy is as good as what the airlines provide. Occasionally, there might be a slight delay between when a seat becomes available and when we detect it, but we're talking seconds, not minutes.",
        },
        {
          id: "booking",
          question: "Can I book seats directly through MySeatMap?",
          answer:
            "Not yet. When we alert you about an available seat, you'll need to book it through your airline's website or app. We're working on direct booking integration, but for now, we focus on being the fastest alert system out there.",
        },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-16">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 text-balance">Frequently Asked Questions</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto text-pretty">
            Everything you need to know about MySeatMap. Can&apos;t find what you&apos;re looking for?{" "}
            <Link href="/contact" className="underline hover:text-gray-900">
              Get in touch
            </Link>
            .
          </p>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-12">
          {faqSections.map((section) => (
            <div key={section.id} id={section.id}>
              <h2 className="text-3xl font-bold mb-6 border-b pb-3">{section.title}</h2>
              <div className="space-y-6">
                {section.questions.map((item) => (
                  <div key={item.id} id={item.id} className="scroll-mt-20">
                    <h3 className="text-xl font-semibold mb-2">{item.question}</h3>
                    <p className="text-gray-600 leading-relaxed">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center bg-gray-50 rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-4">Still have questions?</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            We&apos;re here to help. Reach out to our team and we&apos;ll get back to you as soon as possible.
          </p>
          <Link href="/contact">
            <Button className="bg-black text-white hover:bg-gray-800 rounded-full px-8 cursor-pointer">
              Contact Support
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
