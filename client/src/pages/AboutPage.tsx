import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center text-gray-900">
              About Math W+A+O+K
            </CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <div className="space-y-6">
              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">Our Mission</h2>
                <p className="text-gray-600 leading-relaxed">
                  Math W+A+O+K is an innovative interactive math learning platform designed to transform 
                  mathematical practice into an engaging and adaptive educational experience. We focus on 
                  personalized learning and user motivation through cutting-edge technological solutions.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">What We Offer</h2>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>Adaptive learning algorithms that adjust to your skill level</li>
                  <li>Comprehensive performance tracking and analytics</li>
                  <li>Interactive exercises with immediate feedback</li>
                  <li>Multilingual support for global accessibility</li>
                  <li>Progressive rewards system to maintain motivation</li>
                  <li>Mobile-responsive design for learning anywhere</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">Technology Stack</h2>
                <p className="text-gray-600 leading-relaxed">
                  Our platform is built with modern web technologies including React.js, TypeScript, 
                  and advanced backend systems to ensure a smooth, reliable learning experience across 
                  all devices.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">Our Vision</h2>
                <p className="text-gray-600 leading-relaxed">
                  We believe that mathematics should be accessible, engaging, and enjoyable for everyone. 
                  Through personalized learning experiences and innovative technology, we're working to 
                  make math education more effective and inspiring for learners worldwide.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}