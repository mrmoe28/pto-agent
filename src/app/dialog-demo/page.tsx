import DialogExample from '@/components/DialogExample'
import PermitOfficeDialog from '@/components/PermitOfficeDialog'

// Sample permit office data for demonstration
const sampleOffice = {
  id: '53934f1b-d735-480e-9d13-dd88d58d117f',
  created_at: '2025-09-14 15:03:00.041887+00',
  updated_at: '2025-09-17 22:41:20.774726+00',
  city: 'Atlanta',
  county: 'Fulton',
  state: 'GA',
  jurisdiction_type: 'city',
  department_name: 'Department of City Planning - Bureau of Buildings',
  office_type: 'combined',
  address: '55 Trinity Avenue SW, Suite 3350, Atlanta, GA 30303',
  phone: '(404) 330-6145',
  email: 'permits@atlantaga.gov',
  website: 'https://www.atlantaga.gov/government/departments/city-planning/bureau-of-buildings',
  hours_monday: '8:00 AM - 5:00 PM',
  hours_tuesday: '8:00 AM - 5:00 PM',
  hours_wednesday: '8:00 AM - 5:00 PM',
  hours_thursday: '8:00 AM - 5:00 PM',
  hours_friday: '8:00 AM - 5:00 PM',
  hours_saturday: null,
  hours_sunday: null,
  building_permits: true,
  electrical_permits: true,
  plumbing_permits: true,
  mechanical_permits: true,
  zoning_permits: true,
  planning_review: true,
  inspections: true,
  online_applications: true,
  online_payments: true,
  permit_tracking: true,
  online_portal_url: 'https://aca-prod.accela.com/ATLANTA',
  latitude: null,
  longitude: null,
  service_area_bounds: null,
  data_source: 'manual',
  last_verified: null,
  crawl_frequency: 'weekly',
  active: true,
  distance: 2.5
}

export default function DialogDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Radix UI Dialog Examples
          </h1>
          <p className="text-xl text-gray-600">
            Interactive examples of Radix UI Dialog components in the PTO Agent application
          </p>
        </div>

        <div className="space-y-12">
          {/* Basic Dialog Examples */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Basic Dialog Examples</h2>
            <DialogExample />
          </section>

          {/* Permit Office Dialog Example */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Permit Office Dialog</h2>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {sampleOffice.department_name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {sampleOffice.city}, {sampleOffice.state} • {sampleOffice.distance} miles away
                  </p>
                </div>
                <PermitOfficeDialog 
                  office={sampleOffice}
                  trigger={
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Full Details
                    </button>
                  }
                />
              </div>
              <p className="text-sm text-gray-700">
                Click the button above to see a comprehensive dialog with all permit office information,
                including contact details, operating hours, services offered, and online portal access.
              </p>
            </div>
          </section>

          {/* Features Section */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Dialog Features</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Accessibility</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Keyboard navigation support</li>
                  <li>• Screen reader compatibility</li>
                  <li>• Focus management</li>
                  <li>• ARIA attributes</li>
                  <li>• Escape key to close</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Customization</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Custom triggers</li>
                  <li>• Flexible content layout</li>
                  <li>• Tailwind CSS styling</li>
                  <li>• Animation support</li>
                  <li>• Responsive design</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Usage Examples */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Usage Examples</h2>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Implementation</h3>
              <pre className="bg-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

function MyDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>
            Dialog description goes here.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p>Your content here.</p>
        </div>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}`}
              </pre>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
