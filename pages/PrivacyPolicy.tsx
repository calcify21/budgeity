import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy: React.FC = () => {
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
          Privacy Policy
        </h1>
        <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 space-y-4">
          <p className="font-medium">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">
            1. Introduction
          </h2>
          <p>
            Welcome to Budgeity. Budgeity is a personal financial budgeting tool
            accessible globally. We are committed to protecting your privacy and
            ensuring your data is handled securely.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50 my-4">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300 m-0">
              <strong>Important Clarification:</strong> Budgeity is a software
              tool for financial tracking and management. We are not a bank,
              financial institution, or financial advisor. We do not provide
              financial, investment, legal, or tax advice.
            </p>
          </div>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">
            2. Data We Collect
          </h2>
          <p>
            We may collect, use, store, and transfer different kinds of personal
            data about you to provide our services. This includes:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Identity Data:</strong> Name, username, profile picture,
              or similar identifier.
            </li>
            <li>
              <strong>Contact Data:</strong> Email address.
            </li>
            <li>
              <strong>Financial Data:</strong> Transactions, budgets,
              categories, wallet balances, and financial goals that you input
              into the application.
            </li>
            <li>
              <strong>Technical Data:</strong> Internet Protocol (IP) address,
              browser type and version, time zone setting and location, browser
              plug-in types and versions, operating system and platform, and
              other technology on the devices you use to access this
              application.
            </li>
            <li>
              <strong>Usage Data:</strong> Information about how you use our
              application, interact with features, and interaction logs.
            </li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">
            3. Legal Basis for Processing
          </h2>
          <p>We process your personal data under the following legal bases:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Contractual Necessity:</strong> Where we need to perform
              the contract we are about to enter into or have entered into with
              you (e.g., providing the application features).
            </li>
            <li>
              <strong>Consent:</strong> Where you have provided unambiguous
              consent for specific processing operations.
            </li>
            <li>
              <strong>Legitimate Interests:</strong> Where it is necessary for
              our legitimate business interests, provided your fundamental
              rights do not override those interests.
            </li>
            <li>
              <strong>Legal Obligation:</strong> Where we need to comply with a
              legal or regulatory obligation.
            </li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">
            4. International Data Transfers
          </h2>
          <p>
            As a globally available application, your data may be stored,
            processed, and transmitted in countries outside your place of
            residence. We use Google Firebase to host our infrastructure and
            store user data. We ensure appropriate safeguards are in place to
            maintain the security and privacy of your data during these
            international transfers, in accordance with applicable data
            protection laws.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">
            5. Data Retention
          </h2>
          <p>
            We will only retain your personal data for as long as your account
            is active or as reasonably necessary to fulfill the purposes we
            collected it for, including for the purposes of satisfying any
            legal, regulatory, tax, accounting or reporting requirements. Upon
            account deletion, user records and associated financial data are
            securely purged, although minimal transactional logs may remain in
            encrypted system backups until those backups expire.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">
            6. Your Privacy Rights
          </h2>
          <p>
            Depending on your location and applicable local laws, you may have
            certain rights regarding your personal data, including the right to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Request access to your personal data.</li>
            <li>
              Request correction of the personal data that we hold about you.
            </li>
            <li>Request erasure of your personal data.</li>
            <li>Object to processing of your personal data.</li>
            <li>Request restriction of processing of your personal data.</li>
            <li>
              Request the transfer of your personal data to you or a third party
              (data portability).
            </li>
            <li>
              Withdraw consent at any time where we are relying on consent to
              process your personal data.
            </li>
          </ul>
          <p>To exercise any of these rights, please contact us.</p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">
            7. Data Security
          </h2>
          <p>
            We have implemented strong security measures to protect your data.
            This includes encryption in transit, secure authentication
            mechanisms, strict access controls, and the utilization of Firebase
            security rules to ensure data is only accessible to authorized users
            (e.g., members of your specific household). We constantly monitor
            our systems for potential vulnerabilities.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">
            8. Cookies and Tracking
          </h2>
          <p>
            Our application operates primarily by utilizing essential cookies
            and local storage to maintain session state, authentication tokens,
            and user preferences (like your preferred currency or theme). We do
            not employ third-party tracking or marketing cookies without your
            explicit consent.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">
            9. Changes to This Policy
          </h2>
          <p>
            We reserve the right to update this privacy policy at any time to
            reflect changes in our practices or changes in applicable laws. We
            will post any policy changes on this page. Your continued use of
            Budgeity following the posting of changes constitutes your
            acceptance of such changes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
