import Link from "next/link"

export function Footer() {
  // Use a fixed year to prevent hydration mismatch
  const currentYear = 2025

  return (
    <footer className="border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto px-6 py-8 text-center">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-sm mb-3">Product</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/search" className="hover:text-gray-900">
                  Search Flights
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-gray-900">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-gray-900">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-sm mb-3">Company</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/about" className="hover:text-gray-900">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-gray-900">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-sm mb-3">Legal</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/privacy" className="hover:text-gray-900">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-gray-900">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-gray-900">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-sm mb-3">Support</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/help" className="hover:text-gray-900">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-gray-900">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 pt-6 flex flex-col justify-between items-center text-sm text-gray-600 text-center md:flex-col gap-1">
          <p>© {currentYear} MySeatMap. All rights reserved.</p>
          <p className="mt-2 md:mt-0">
            Made with <span className="text-red-500 text-xs">❤️</span> in San Francisco for travelers worldwide.
          </p>
        </div>
      </div>
    </footer>
  )
}
