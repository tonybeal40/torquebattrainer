export default function PrivacyPage() {
  const effectiveDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-3xl px-6 py-8 leading-relaxed">
        <h1 className="text-2xl font-semibold text-sky-400 mb-2">Privacy Policy</h1>
        <p className="text-slate-400 mb-6">
          <strong>Effective Date:</strong> {effectiveDate}
        </p>

        <p className="text-slate-300 mb-6">
          This application provides instructional baseball swing feedback based on user-submitted video.
        </p>

        <h2 className="text-lg font-semibold text-sky-400 mt-7 mb-3">Information We Collect</h2>
        <p className="text-slate-300 mb-4">
          • Video files voluntarily uploaded by the user for swing analysis<br />
          • Basic technical data required to process the request (device, browser type)
        </p>

        <h2 className="text-lg font-semibold text-sky-400 mt-7 mb-3">How Information Is Used</h2>
        <p className="text-slate-300 mb-4">
          Uploaded videos are processed solely to generate instructional swing feedback.<br />
          Videos are not sold, shared, or used for advertising purposes.<br />
          Videos are not used to train external machine-learning models.
        </p>

        <h2 className="text-lg font-semibold text-sky-400 mt-7 mb-3">Data Retention</h2>
        <p className="text-slate-300 mb-4">
          Uploaded videos are processed temporarily and are not stored long-term.<br />
          Analysis results are generated in real time.
        </p>

        <h2 className="text-lg font-semibold text-sky-400 mt-7 mb-3">Third-Party Services</h2>
        <p className="text-slate-300 mb-4">
          This app may use third-party services to process analysis requests.<br />
          No personal data is sold or shared with third parties.
        </p>

        <h2 className="text-lg font-semibold text-sky-400 mt-7 mb-3">Children's Privacy</h2>
        <p className="text-slate-300 mb-4">
          This app is intended for instructional use. Parental guidance is recommended for minors.
        </p>

        <h2 className="text-lg font-semibold text-sky-400 mt-7 mb-3">Medical Disclaimer</h2>
        <p className="text-slate-300 mb-4">
          This application does not provide medical advice, injury diagnosis, or treatment recommendations.
        </p>

        <h2 className="text-lg font-semibold text-sky-400 mt-7 mb-3">Contact</h2>
        <p className="text-slate-300">
          If you have questions about this policy, contact:<br />
          <strong className="text-slate-100">support@torquebattrainer.com</strong>
        </p>
      </div>
    </div>
  );
}
