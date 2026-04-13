import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-6 py-20 max-w-4xl">
        <Link href="/">
          <Button variant="ghost" className="mb-8 hover:bg-slate-50">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Button>
        </Link>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="h-12 w-12 rounded-2xl bg-teal-50 flex items-center justify-center">
            <FileText className="h-6 w-6 text-teal-600" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Terms of Service</h1>
        </div>

        <div className="prose prose-slate max-w-none">
          <p className="text-lg text-slate-600 mb-8">
            Last Updated: April 13, 2026
          </p>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">1. Acceptance of Terms</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              By accessing the Excel Academy portal, you agree to comply with these Terms of Service and all applicable laws in Ethiopia.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">2. User Accounts</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Users are responsible for maintaining the confidentiality of their login credentials. Any activity performed through a user account is the responsibility of the account owner.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">3. Academic Integrity</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Users must not attempt to manipulate academic records, results, or attendance data. Unauthorized access to the Admin portal is strictly prohibited and subject to disciplinary action.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">4. System Availability</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              While we strive for 100% uptime, Excel Academy does not guarantee uninterrupted access to the portal during maintenance or unforeseen technical issues.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">5. Modifications</h2>
            <p className="text-slate-600 leading-relaxed">
              Excel Academy reserves the right to modify these terms at any time. Continued use of the portal after such changes constitutes acceptance of the new terms.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
