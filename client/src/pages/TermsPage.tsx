import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center text-gray-900">
              Terms of Service
            </CardTitle>
            <p className="text-center text-gray-600 mt-2">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <div className="space-y-6">
              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">Acceptance of Terms</h2>
                <p className="text-gray-600 leading-relaxed">
                  By accessing and using Math W+A+O+K, you accept and agree to be bound by the terms 
                  and provision of this agreement. These Terms of Service govern your use of our 
                  educational platform and services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">Use of Service</h2>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>You must be at least 13 years old to use this service</li>
                  <li>You are responsible for maintaining the confidentiality of your account</li>
                  <li>You agree to use the service only for lawful purposes</li>
                  <li>You will not attempt to interfere with the proper functioning of the service</li>
                  <li>You will not share your account credentials with others</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">Educational Content</h2>
                <p className="text-gray-600 leading-relaxed">
                  Our educational content is provided for learning purposes. While we strive for accuracy, 
                  we make no warranties about the completeness or reliability of the content. You are 
                  responsible for verifying information and using it appropriately.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">User Content</h2>
                <p className="text-gray-600 leading-relaxed">
                  You retain ownership of any content you submit to our platform. By submitting content, 
                  you grant us a license to use, modify, and display it as necessary to provide our services. 
                  You are responsible for ensuring your content complies with applicable laws.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">Limitation of Liability</h2>
                <p className="text-gray-600 leading-relaxed">
                  Math W+A+O+K shall not be liable for any indirect, incidental, special, consequential, 
                  or punitive damages resulting from your use of our service. Our total liability shall 
                  not exceed the amount paid by you for the service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">Termination</h2>
                <p className="text-gray-600 leading-relaxed">
                  We may terminate or suspend your account at any time for violations of these terms. 
                  Upon termination, your right to use the service will cease immediately, but these 
                  terms will remain in effect.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">Changes to Terms</h2>
                <p className="text-gray-600 leading-relaxed">
                  We reserve the right to modify these terms at any time. We will notify users of 
                  significant changes, and continued use of the service constitutes acceptance of 
                  the modified terms.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}