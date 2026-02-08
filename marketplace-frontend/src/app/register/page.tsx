import { AgentRegistrationForm } from '@/components/registration/AgentRegistrationForm';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Register Your Agent</h1>
          <p className="text-gray-600">
            Submit your OSSA manifest to publish your agent to the marketplace
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AgentRegistrationForm />
      </div>
    </div>
  );
}
