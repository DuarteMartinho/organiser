import Link from 'next/link'

export default function AuthComparisonPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Authentication Systems Comparison</h1>
          <p className="text-gray-600">Choose between Supabase Auth and Better Auth</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Supabase Auth Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-green-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Supabase Auth</h2>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                Current
              </span>
            </div>
            
            <p className="text-gray-600 mb-6">
              Existing authentication system using Supabase Auth services.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span className="text-sm text-gray-700">Hosted authentication service</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span className="text-sm text-gray-700">Managed user database</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span className="text-sm text-gray-700">Built-in OAuth providers</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span className="text-sm text-gray-700">Row-level security</span>
              </div>
            </div>

            <Link
              href="/auth"
              className="block w-full text-center px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all shadow-md hover:shadow-lg"
            >
              Sign In with Supabase
            </Link>

            <div className="mt-4 text-xs text-gray-500 text-center">
              Route: <code className="bg-gray-100 px-2 py-1 rounded">/auth</code>
            </div>
          </div>

          {/* Better Auth Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Better Auth</h2>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                Migration
              </span>
            </div>
            
            <p className="text-gray-600 mb-6">
              New authentication system with full control and local database.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">✓</span>
                <span className="text-sm text-gray-700">Self-hosted authentication</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">✓</span>
                <span className="text-sm text-gray-700">PostgreSQL with Drizzle</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">✓</span>
                <span className="text-sm text-gray-700">Type-safe authentication</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">✓</span>
                <span className="text-sm text-gray-700">Full data ownership</span>
              </div>
            </div>

            <Link
              href="/auth"
              className="block w-full text-center px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md hover:shadow-lg"
            >
              Sign In with Better Auth
            </Link>

            <div className="mt-4 text-xs text-gray-500 text-center">
              Route: <code className="bg-gray-100 px-2 py-1 rounded">/auth</code>
            </div>
          </div>
        </div>

        {/* Technical Comparison Table */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Technical Comparison</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-700 font-semibold">Feature</th>
                  <th className="text-left py-3 px-4 text-gray-700 font-semibold">Supabase Auth</th>
                  <th className="text-left py-3 px-4 text-gray-700 font-semibold">Better Auth</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-600">Hosting</td>
                  <td className="py-3 px-4 text-gray-900">Supabase Cloud</td>
                  <td className="py-3 px-4 text-gray-900">Self-hosted</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-600">Database</td>
                  <td className="py-3 px-4 text-gray-900">Supabase PostgreSQL</td>
                  <td className="py-3 px-4 text-gray-900">Local PostgreSQL</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-600">ORM</td>
                  <td className="py-3 px-4 text-gray-900">Supabase Client</td>
                  <td className="py-3 px-4 text-gray-900">Drizzle ORM</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-600">Sessions</td>
                  <td className="py-3 px-4 text-gray-900">JWT Tokens</td>
                  <td className="py-3 px-4 text-gray-900">Secure Cookies</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-600">OAuth Providers</td>
                  <td className="py-3 px-4 text-gray-900">Google</td>
                  <td className="py-3 px-4 text-gray-900">Google</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-600">API Routes</td>
                  <td className="py-3 px-4 text-gray-900">/auth/callback</td>
                  <td className="py-3 px-4 text-gray-900">/api/auth/[...all]</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-600">Type Safety</td>
                  <td className="py-3 px-4 text-gray-900">Partial</td>
                  <td className="py-3 px-4 text-gray-900">Full TypeScript</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-600">Data Control</td>
                  <td className="py-3 px-4 text-gray-900">Supabase managed</td>
                  <td className="py-3 px-4 text-gray-900">Full ownership</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
