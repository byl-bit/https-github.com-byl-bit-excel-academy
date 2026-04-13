import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-6 py-20 max-w-4xl">
        <Link href="/">
          <Button variant="ghost" className="mb-8 hover:bg-slate-50">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Button>
        </Link>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="h-12 w-12 rounded-2xl bg-cyan-50 flex items-center justify-center">
            <Shield className="h-6 w-6 text-cyan-600" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Privacy Policy</h1>
        </div>

        <div className="prose prose-slate max-w-none">
          <p className="text-lg text-slate-600 mb-8">
            Last Updated: April 13, 2026
          </p>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">1. Information Collection</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Excel Academy collects personal information necessary for educational administration, including student profiles, academic records, and attendance data. This information is provided by students, parents, and teachers during the registration process.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">2. Use of Information</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              The data collected is used solely for:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Academic performance tracking and reporting</li>
              <li>Attendance management</li>
              <li>Communication between school and parents/students</li>
              <li>System security and authentication</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">3. Data Security</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              We implement industry-standard security measures to protect your data from unauthorized access. Access to sensitive academic data is restricted based on user roles (Admin, Teacher, Student).
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">4. Third Parties</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Excel Academy does not sell or share personal information with third-party organizations for marketing purposes. Data may only be shared with educational authorities as required by Ethiopian law.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">5. Contact</h2>
            <p className="text-slate-600 leading-relaxed">
              For privacy-related inquiries, please contact us at <a href="mailto:privacy@excel.edu" className="text-cyan-600 font-bold hover:underline">privacy@excel.edu</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
