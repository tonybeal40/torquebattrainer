export default function AppleSignInSetupPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-3xl px-6 py-8 leading-relaxed">
        <h1 className="text-2xl font-semibold text-sky-400 mb-2">Apple Sign-In Setup Guide</h1>
        <p className="text-slate-400 mb-6">
          Follow these steps to enable Sign in with Apple for your app
        </p>

        <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-4 mb-6">
          <p className="text-amber-200 text-sm">
            <strong>Apple Requirement:</strong> If your app offers any third-party sign-in options (like Google, Facebook, or Replit Auth), Apple requires you to also offer "Sign in with Apple" as an option.
          </p>
        </div>

        <h2 className="text-lg font-semibold text-sky-400 mt-7 mb-3">Prerequisites</h2>
        <ul className="text-slate-300 mb-4 space-y-2">
          <li>• Active Apple Developer Program membership ($99/year)</li>
          <li>• Access to your Apple Developer account</li>
          <li>• Your app's bundle identifier</li>
        </ul>

        <h2 className="text-lg font-semibold text-sky-400 mt-7 mb-3">Step 1: Enable Sign in with Apple</h2>
        <ol className="text-slate-300 mb-4 space-y-2 list-decimal list-inside">
          <li>Go to Apple Developer Portal → Certificates, IDs & Profiles</li>
          <li>Select your App ID or create a new one</li>
          <li>Enable "Sign In with Apple" capability</li>
          <li>Configure your app for "Sign In with Apple for Websites"</li>
        </ol>

        <h2 className="text-lg font-semibold text-sky-400 mt-7 mb-3">Step 2: Create a Services ID</h2>
        <ol className="text-slate-300 mb-4 space-y-2 list-decimal list-inside">
          <li>In the Identifiers section, click (+) to add a new identifier</li>
          <li>Select "Services IDs" and continue</li>
          <li>Enter a description (e.g., "Swing Analyzer Web")</li>
          <li>Enter an identifier (e.g., "com.torquebat.swinganalyzer.web")</li>
          <li>Enable "Sign in with Apple" and click Configure</li>
          <li>Add your domain and return URL</li>
        </ol>

        <h2 className="text-lg font-semibold text-sky-400 mt-7 mb-3">Step 3: Generate a Private Key</h2>
        <ol className="text-slate-300 mb-4 space-y-2 list-decimal list-inside">
          <li>Go to Keys section and click (+)</li>
          <li>Name your key (e.g., "Swing Analyzer Auth Key")</li>
          <li>Enable "Sign in with Apple" and click Configure</li>
          <li>Select your Primary App ID</li>
          <li>Download the .p8 file (save it securely - you can only download once)</li>
          <li>Note down the Key ID</li>
        </ol>

        <h2 className="text-lg font-semibold text-sky-400 mt-7 mb-3">Step 4: Required Environment Variables</h2>
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 mb-4 font-mono text-sm">
          <p className="text-slate-300">APPLE_CLIENT_ID=your.services.id</p>
          <p className="text-slate-300">APPLE_TEAM_ID=your_team_id</p>
          <p className="text-slate-300">APPLE_KEY_ID=your_key_id</p>
          <p className="text-slate-300">APPLE_PRIVATE_KEY=contents_of_p8_file</p>
        </div>

        <h2 className="text-lg font-semibold text-sky-400 mt-7 mb-3">Step 5: Domain Verification</h2>
        <ol className="text-slate-300 mb-4 space-y-2 list-decimal list-inside">
          <li>Download the domain verification file from Apple</li>
          <li>Host it at: yourdomain.com/.well-known/apple-developer-domain-association.txt</li>
          <li>Verify the domain in your Apple Developer account</li>
        </ol>

        <div className="bg-emerald-900/30 border border-emerald-700/50 rounded-lg p-4 mt-6">
          <p className="text-emerald-200 text-sm">
            <strong>Ready to implement?</strong> Once you have your Apple Developer credentials, contact your developer to integrate Apple Sign-In into this application.
          </p>
        </div>

        <div className="mt-8">
          <a href="/" className="text-sky-400 hover:text-sky-300">
            ← Back to App
          </a>
        </div>
      </div>
    </div>
  );
}
