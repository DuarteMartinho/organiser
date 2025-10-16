import Link from 'next/link'
import { Trophy, Users, Calendar, Zap, Smartphone, Mail, Home } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/server'

export default async function HomePage() {
  const user = await getCurrentUser()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Football Organiser
            </span>
          </div>
          {user ? (
            <Link
              href="/dashboard"
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
            >
              Go to Dashboard
            </Link>
          ) : (
            <Link
              href="/auth"
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center relative overflow-hidden">
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>
        
        <div className="relative z-10">
          <div className="inline-block mb-4">
            <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold">
              🎉 Now with Mobile Apps Coming Soon!
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 bg-gradient-to-r from-blue-600 via-blue-500 to-green-600 bg-clip-text text-transparent leading-tight">
            Welcome to Football Organiser
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-4 max-w-3xl mx-auto font-medium">
            The ultimate platform to organize, manage, and enjoy football matches with your friends
          </p>
          <p className="text-lg text-gray-500 mb-10 max-w-2xl mx-auto">
            Join thousands of players who trust us to organize their games. Simple, fast, and completely free!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {user ? (
              <Link
                href="/dashboard"
                className="px-10 py-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-2xl hover:scale-105 transform"
              >
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  href="/auth"
                  className="px-10 py-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-2xl hover:scale-105 transform"
                >
                  Get Started Free →
                </Link>
                <Link
                  href="#features"
                  className="px-10 py-5 bg-white border-2 border-blue-600 text-blue-600 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all shadow-md hover:shadow-lg"
                >
                  Learn More
                </Link>
              </>
            )}
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Free Forever</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Setup in 2 Minutes</span>
            </div>
          </div>
        </div>
      </section>

      {/* App Stats */}
      <section className="bg-white/50 backdrop-blur-sm py-12 mb-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">1,000+</div>
              <div className="text-gray-600">Active Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">5,000+</div>
              <div className="text-gray-600">Matches Organized</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">250+</div>
              <div className="text-gray-600">Active Groups</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">15,000+</div>
              <div className="text-gray-600">Players Connected</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-800">
            Everything You Need to Organize Football
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Powerful features designed to make organizing matches effortless
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="bg-blue-100 w-16 h-16 rounded-lg flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gray-800">Group Management</h3>
            <p className="text-gray-600 mb-4">
              Create and manage football groups with your friends. Set privacy levels, assign admins, and keep everyone organized.
            </p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                Public & Private groups
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                Admin controls
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                Member invitations
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="bg-green-100 w-16 h-16 rounded-lg flex items-center justify-center mb-4">
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gray-800">Match Scheduling</h3>
            <p className="text-gray-600 mb-4">
              Schedule matches with ease. Set date, time, location, and capacity. Players can join or join the waiting list.
            </p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                Easy scheduling
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                Waiting lists
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                Guest players
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="bg-blue-100 w-16 h-16 rounded-lg flex items-center justify-center mb-4">
              <Trophy className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gray-800">Team Formation</h3>
            <p className="text-gray-600 mb-4">
              Create balanced teams automatically or manually. Randomize teams, assign players, and ensure fair matches.
            </p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                Auto team balancing
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                Manual assignments
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                Randomize teams
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gradient-to-r from-blue-600 to-green-600 py-16 text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
            How It Works
          </h2>
          <p className="text-center text-blue-100 text-xl mb-12 max-w-2xl mx-auto">
            Getting started is quick and easy. Follow these simple steps:
          </p>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-white/20 backdrop-blur-sm w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">Sign Up Free</h3>
              <p className="text-blue-100">
                Create your account in seconds with Google sign-in
              </p>
            </div>
            <div className="text-center">
              <div className="bg-white/20 backdrop-blur-sm w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">Create a Group</h3>
              <p className="text-blue-100">
                Set up your football group and invite your friends
              </p>
            </div>
            <div className="text-center">
              <div className="bg-white/20 backdrop-blur-sm w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">Schedule Matches</h3>
              <p className="text-blue-100">
                Pick a date, time, and location for your game
              </p>
            </div>
            <div className="text-center">
              <div className="bg-white/20 backdrop-blur-sm w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                4
              </div>
              <h3 className="text-xl font-bold mb-2">Play Football!</h3>
              <p className="text-blue-100">
                Teams are organized, players are ready. Enjoy the game!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-800">
            Perfect For Every Occasion
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            No matter your group size or play style, we&apos;ve got you covered
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
            <h3 className="text-xl font-bold mb-2 text-blue-900">⚽ Weekend Warriors</h3>
            <p className="text-blue-800">
              Organize regular weekend matches with your friends. Keep track of who&apos;s playing and balance teams fairly.
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
            <h3 className="text-xl font-bold mb-2 text-green-900">🏢 Company Leagues</h3>
            <p className="text-green-800">
              Run internal football leagues at your company. Track matches, teams, and keep employees engaged.
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
            <h3 className="text-xl font-bold mb-2 text-blue-900">👥 Community Groups</h3>
            <p className="text-blue-800">
              Bring your local community together. Organize pickup games and grow your football network.
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
            <h3 className="text-xl font-bold mb-2 text-green-900">🎓 University Teams</h3>
            <p className="text-green-800">
              Manage university football teams and recreational leagues with ease.
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
            <h3 className="text-xl font-bold mb-2 text-blue-900">🏆 Tournament Organizers</h3>
            <p className="text-blue-800">
              Run small tournaments with multiple groups and matches. Keep everything organized in one place.
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
            <h3 className="text-xl font-bold mb-2 text-green-900">👨‍👩‍👧‍👦 Family & Friends</h3>
            <p className="text-green-800">
              Coordinate games with extended family and friend circles. Never miss a match again.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-gray-800">
            Loved by Players Worldwide
          </h2>
          <p className="text-center text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            See what our users have to say about organizing with us
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4">
                  M
                </div>
                <div>
                  <div className="font-bold text-gray-800">Miguel Santos</div>
                  <div className="text-sm text-gray-500">Weekend Warrior</div>
                </div>
              </div>
              <div className="text-yellow-500 mb-3">★★★★★</div>
              <p className="text-gray-600 italic">
                &quot;This app has completely transformed how we organize our weekend games. No more endless WhatsApp messages!&quot;
              </p>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-green-700 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4">
                  S
                </div>
                <div>
                  <div className="font-bold text-gray-800">Sofia Rodrigues</div>
                  <div className="text-sm text-gray-500">Company League Admin</div>
                </div>
              </div>
              <div className="text-yellow-500 mb-3">★★★★★</div>
              <p className="text-gray-600 italic">
                &quot;Perfect for managing our company league. The team randomizer is a game-changer for fair matches!&quot;
              </p>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4">
                  J
                </div>
                <div>
                  <div className="font-bold text-gray-800">João Silva</div>
                  <div className="text-sm text-gray-500">Community Organizer</div>
                </div>
              </div>
              <div className="text-yellow-500 mb-3">★★★★★</div>
              <p className="text-gray-600 italic">
                &quot;Simple, intuitive, and free! Our community has grown from 10 to 50 players thanks to this platform.&quot;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile App */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-12 text-white text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full -ml-32 -mb-32"></div>
          <div className="relative z-10">
            <Smartphone className="h-16 w-16 mx-auto mb-6 animate-bounce" />
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Coming Soon to Mobile!</h2>
            <p className="text-xl mb-8 text-blue-50 max-w-2xl mx-auto">
              We&apos;re bringing Football Organiser to your pocket. Get ready for iOS and Android apps launching soon!
            </p>
            <div className="flex flex-wrap gap-4 justify-center mb-8">
              <div className="bg-white/20 backdrop-blur-sm px-8 py-4 rounded-lg border border-white/30">
                <div className="text-2xl font-bold">📱 iOS App</div>
                <div className="text-blue-100">App Store - Q1 2026</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-8 py-4 rounded-lg border border-white/30">
                <div className="text-2xl font-bold">🤖 Android App</div>
                <div className="text-blue-100">Google Play - Q1 2026</div>
              </div>
            </div>
            <p className="text-blue-100">
              🔔 Subscribe to our newsletter below to get notified when we launch!
            </p>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl p-12 shadow-xl max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <Mail className="h-12 w-12 mx-auto mb-4 text-blue-600" />
            <h2 className="text-3xl font-bold mb-3 text-gray-800">Stay Updated!</h2>
            <p className="text-gray-600 text-lg">
              Subscribe to our newsletter for updates on new features, mobile app launch, and football tips.
            </p>
          </div>
          <form className="flex flex-col sm:flex-row gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-6 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-lg"
              required
            />
            <button
              type="submit"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg whitespace-nowrap"
            >
              Subscribe
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            Join 500+ subscribers already on the list!
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-6 w-6" />
                <span className="text-xl font-bold">Football Organiser</span>
              </div>
              <p className="text-gray-400">
                Making football organization simple and fun for everyone.
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/auth" className="hover:text-white transition">Sign In</Link></li>
                <li><Link href="/groups" className="hover:text-white transition">Browse Groups</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Follow Us</h3>
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition cursor-pointer">
                  <Zap className="h-5 w-5" />
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition cursor-pointer">
                  <Mail className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Football Organiser. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
