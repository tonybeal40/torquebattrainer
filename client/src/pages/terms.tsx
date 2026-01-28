export default function TermsPage() {
  const effectiveDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-3xl px-6 py-8 leading-relaxed">
        <h1 className="text-2xl font-semibold text-sky-400 mb-2">Terms of Service</h1>
        <p className="text-slate-400 mb-6">
          <strong>Effective Date:</strong> {effectiveDate}
        </p>

        <p className="text-slate-300 mb-6">
          Welcome to Late-Decision Swing Analysis™. By using this application, you agree to the following terms.
        </p>

        <h2 className="text-lg font-semibold text-sky-400 mt-7 mb-3">1. Acceptance of Terms</h2>
        <p className="text-slate-300 mb-4">
          By accessing or using this application, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, please do not use this application.
        </p>

        <h2 className="text-lg font-semibold text-sky-400 mt-7 mb-3">2. Description of Service</h2>
        <p className="text-slate-300 mb-4">
          This application provides instructional baseball swing analysis feedback based on user-submitted video content. The service is intended for educational and training purposes only.
        </p>

        <h2 className="text-lg font-semibold text-sky-400 mt-7 mb-3">3. User Eligibility</h2>
        <p className="text-slate-300 mb-4">
          You must be at least 13 years old to use this application. Users under 18 must have parental or guardian consent. By using the app, you confirm that you meet these requirements.
        </p>

        <h2 className="text-lg font-semibold text-sky-400 mt-7 mb-3">4. User Content</h2>
        <p className="text-slate-300 mb-4">
          You retain ownership of any video content you upload. By uploading content, you grant us a limited license to process it solely for providing swing analysis feedback. We do not share, sell, or use your content for any other purpose.
        </p>

        <h2 className="text-lg font-semibold text-sky-400 mt-7 mb-3">5. Prohibited Uses</h2>
        <p className="text-slate-300 mb-4">
          You agree not to:<br />
          • Upload content that violates any laws or third-party rights<br />
          • Attempt to reverse-engineer or exploit the service<br />
          • Use the service for any commercial purpose without authorization<br />
          • Upload content depicting anyone without their consent
        </p>

        <h2 className="text-lg font-semibold text-sky-400 mt-7 mb-3">6. Disclaimer of Warranties</h2>
        <p className="text-slate-300 mb-4">
          This service is provided "as is" without warranties of any kind. We do not guarantee the accuracy of swing analysis results. This application does not provide medical, injury prevention, or professional coaching advice.
        </p>

        <h2 className="text-lg font-semibold text-sky-400 mt-7 mb-3">7. Limitation of Liability</h2>
        <p className="text-slate-300 mb-4">
          To the fullest extent permitted by law, we shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of this application.
        </p>

        <h2 className="text-lg font-semibold text-sky-400 mt-7 mb-3">8. Account Termination</h2>
        <p className="text-slate-300 mb-4">
          You may delete your account at any time through the app settings. We reserve the right to suspend or terminate accounts that violate these terms.
        </p>

        <h2 className="text-lg font-semibold text-sky-400 mt-7 mb-3">9. Changes to Terms</h2>
        <p className="text-slate-300 mb-4">
          We may update these terms from time to time. Continued use of the application after changes constitutes acceptance of the updated terms.
        </p>

        <h2 className="text-lg font-semibold text-sky-400 mt-7 mb-3">10. Contact</h2>
        <p className="text-slate-300">
          For questions about these terms, contact:<br />
          <strong className="text-slate-100">support@torquebattrainer.com</strong>
        </p>
      </div>
    </div>
  );
}
