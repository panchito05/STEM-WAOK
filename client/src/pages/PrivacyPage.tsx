import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center text-gray-900">
              Privacy Policy
            </CardTitle>
            <p className="text-center text-gray-600 mt-2">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <div className="space-y-6">
              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">Information We Collect</h2>
                <p className="text-gray-600 leading-relaxed">
                  We collect information you provide directly to us, such as when you create an account, 
                  use our educational services, or contact us for support. This may include your name, 
                  email address, and learning progress data.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">How We Use Your Information</h2>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>To provide and improve our educational services</li>
                  <li>To personalize your learning experience</li>
                  <li>To track your progress and provide feedback</li>
                  <li>To communicate with you about your account</li>
                  <li>To ensure the security of our platform</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">Data Protection</h2>
                <p className="text-gray-600 leading-relaxed">
                  We implement appropriate security measures to protect your personal information against 
                  unauthorized access, alteration, disclosure, or destruction. Your data is stored securely 
                  and access is limited to authorized personnel only.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">Cookies and Tracking</h2>
                <p className="text-gray-600 leading-relaxed">
                  We use cookies and similar technologies to enhance your experience, analyze usage patterns, 
                  and maintain your session. You can control cookie settings through your browser preferences.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">Your Rights</h2>
                <p className="text-gray-600 leading-relaxed">
                  You have the right to access, update, or delete your personal information. You may also 
                  request a copy of your data or ask us to stop processing your information. Contact us 
                  to exercise these rights.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">Contact Us</h2>
                <p className="text-gray-600 leading-relaxed">
                  If you have any questions about this Privacy Policy, please contact us through our 
                  contact page or email us directly.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}