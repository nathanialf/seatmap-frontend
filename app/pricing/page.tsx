import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check } from "lucide-react"
import Link from "next/link"

export default function PricingPage() {
  const plans = [
    {
      name: "Basic",
      price: "$0",
      period: "forever",
      description: "Perfect for trying out MySeatMap",
      features: [
        "View 4 seat maps per month",
        "Community support",
      ],
      cta: "Get Started",
      highlighted: false,
    },
    {
      name: "Pro",
      price: "$9",
      period: "per month",
      description: "Ideal for frequent flyers",
      features: [
        "View 50 seat maps per month",
        "Track 10 flights or routes",
        "Email notifications",
        "Advanced seat map with details",
        "Priority support",
        "Seat preference filters",
        "Flight connections available",
      ],
      cta: "Start Free Trial",
      highlighted: true,
    },
    {
      name: "Business",
      price: "$49",
      period: "one-time",
      description: "Lifetime access for professionals",
      features: [
        "Unlimited seat map views",
        "Track unlimited floghts and routes",
        "Email notifications",
        "Advanced seat map with details",
        "Priority support",
        "Seat preference filters",
        "Flight connections available",
        "24/7 dedicated support",
        "Lifetime updates",
      ],
      cta: "Buy now",
      highlighted: false,
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 text-balance">Simple, transparent pricing</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto text-pretty">
            Choose the plan that works best for you. All plans include a 7-day free trial.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`p-8 relative ${plan.highlighted ? "border-2 border-black shadow-xl" : ""}`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-black text-white text-sm px-4 py-1 rounded-full">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold">{plan.price}</span>
                  <span className="text-gray-600">/{plan.period}</span>
                </div>
              </div>

              <Link href="/auth/signup">
                <Button
                  className={`w-full rounded-full mb-6 cursor-pointer ${
                    plan.highlighted
                      ? "bg-black text-white hover:bg-gray-800"
                      : "bg-transparent border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-100 text-black"
                  }`}
                >
                  {plan.cta}
                </Button>
              </Link>

              <div className="space-y-3">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>

          <div className="space-y-6">
            <div className="border-b pb-6">
              <h3 className="text-xl font-semibold mb-2">How does the free trial work?</h3>
              <p className="text-gray-600">
                All paid plans come with a 7-day free trial. No credit card required. You can cancel anytime during the
                trial period without being charged.
              </p>
            </div>

            <div className="border-b pb-6">
              <h3 className="text-xl font-semibold mb-2">Can I change plans later?</h3>
              <p className="text-gray-600">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we&apos;ll
                prorate any charges.
              </p>
            </div>

            <div className="border-b pb-6">
              <h3 className="text-xl font-semibold mb-2">Which airlines are supported?</h3>
              <p className="text-gray-600">
                We support all major airlines including American, Delta, United, Southwest, and over 100 international
                carriers.
              </p>
            </div>

            <div className="border-b pb-6">
              <h3 className="text-xl font-semibold mb-2">How fast are the alerts?</h3>
              <p className="text-gray-600">
                Our system checks seat availability every 2-5 minutes and sends alerts within seconds of detecting a
                change.
              </p>
            </div>

            <div className="pb-6">
              <h3 className="text-xl font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600">
                We accept all major credit cards (Visa, Mastercard, American Express) and PayPal for Business plans.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center bg-gray-50 rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to never miss your perfect seat?</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of travelers who use MySeatMap to get the seats they want on every flight.
          </p>
          <Link href="/auth/signup">
            <Button className="bg-black text-white hover:bg-gray-800 rounded-full px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base cursor-pointer">
              Start Free Trial
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
