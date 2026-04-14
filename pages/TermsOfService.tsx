import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TermsOfService: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-brand-600 dark:text-brand-400 hover:text-brand-500 font-medium transition-colors mb-8"
      >
        <ArrowLeft size={20} />
        Back to Budgeity
      </Link>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-slate-200 dark:border-white/10 p-8 sm:p-12">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
          Terms of Service
        </h1>
        <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 space-y-4">
          <p className="font-medium">
            Last updated: February 26, 2026
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">
            1. Global Agreement to Terms
          </h2>
          <p>
            By accessing or using Budgeity from any location, you agree to be
            bound by these Terms of Service and all applicable laws and
            regulations. If you do not agree with any of these terms, you are
            prohibited from using or accessing this service.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">
            2. Financial Disclaimer (CRITICAL)
          </h2>
          <div className="bg-amber-50 dark:bg-amber-900/30 p-4 rounded-xl border border-amber-200 dark:border-amber-800/50 my-4">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200 m-0">
              <strong>
                Budgeity is a budgeting and financial tracking tool only.
              </strong>{" "}
              It does not provide financial, investment, tax, or legal advice.
              Any financial decisions you make based on the information provided
              within the application are solely at your own risk. We strongly
              recommend consulting with a qualified professional before making
              any significant financial or investment decisions.
            </p>
          </div>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">
            3. Account Responsibility
          </h2>
          <p>
            You are entirely responsible for maintaining the confidentiality of
            your login credentials and the security of your account. You agree
            to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Provide accurate, current, and complete information during the
              registration process.
            </li>
            <li>Keep your account information updated.</li>
            <li>
              Promptly notify us of any unauthorized use of your account or any
              other security breach.
            </li>
            <li>
              Accept full responsibility for all activities that occur under
              your account.
            </li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">
            4. Acceptable Use
          </h2>
          <p>
            You agree not to use Budgeity for any unlawful purpose or in any way
            that interrupts, damages, or impairs the service. Prohibited
            activities include, but are not limited to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Engaging in any illegal, fraudulent, or malicious activity.</li>
            <li>
              Attempting to bypass, disable, or interfere with security-related
              features.
            </li>
            <li>
              Reverse engineering, decompiling, or disassembling any portion of
              the application.
            </li>
            <li>
              Abusing the system by systematically extracting data or scraping
              content.
            </li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">
            5. Currency Conversion Disclaimer
          </h2>
          <p>
            Budgeity may support the display of various global currencies.
            Please note that any currency conversion rates displayed within the
            application are indicative only and for convenience. They may not
            reflect real-time financial institution or foreign exchange market
            rates.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">
            6. Limitation of Liability
          </h2>
          <p>
            To the fullest extent permitted by applicable law, in no event shall
            Budgeity, its developers, or affiliates be liable for any indirect,
            incidental, special, consequential, or punitive damages, including
            without limitation:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Financial losses resulting from decisions based on data tracked in
              the application.
            </li>
            <li>
              Loss of profits, data, use, goodwill, or other intangible losses.
            </li>
            <li>
              Damages arising from any interruption or cessation of transmission
              to or from the service.
            </li>
          </ul>
          <p>
            We provide the service on an "AS IS" and "AS AVAILABLE" basis
            without warranties of any kind.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">
            7. Termination
          </h2>
          <p>
            We reserve the right to suspend or terminate your account and block
            access to our service at any time, with or without cause, and
            without prior notice. You may also delete your account at any time.
            Upon termination, your right to use the service will immediately
            cease, and user-generated data may be handled or deleted in
            accordance with our Privacy Policy.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">
            8. Governing Law
          </h2>
          <p>
            These Terms shall be governed by the laws applicable in the
            jurisdiction of the service provider’s principal place of operation,
            or where required by applicable consumer protection legislation, the
            laws of the jurisdiction where the user resides.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">
            9. Modifications to Terms
          </h2>
          <p>
            We may revise these Terms of Service at any time. We will provide
            notice of any significant modifications by updating the "Last
            updated" date on this page or by posting a notice within the
            application. Your continued use of the application after such
            modifications constitutes your acceptance of the revised terms.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
