import React from 'react';
import RegisterForm from '../components/Auth/RegisterForm';
import { GraduationCap } from 'lucide-react';

const RegisterPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <GraduationCap className="h-10 w-10 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">AlumniConnect</span>
          </div>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
};

export default RegisterPage;