import React from 'react';
import { Search, Filter } from 'lucide-react';

interface DirectoryFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  graduationYear: string;
  onGraduationYearChange: (value: string) => void;
  department: string;
  onDepartmentChange: (value: string) => void;
  company: string;
  onCompanyChange: (value: string) => void;
  location: string;
  onLocationChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
}

const DirectoryFilters: React.FC<DirectoryFiltersProps> = ({
  searchTerm,
  onSearchChange,
  graduationYear,
  onGraduationYearChange,
  department,
  onDepartmentChange,
  company,
  onCompanyChange,
  location,
  onLocationChange,
  sortBy,
  onSortChange,
}) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  const departments = [
    'Computer Science',
    'Engineering',
    'Business Administration',
    'Medicine',
    'Law',
    'Education',
    'Arts & Sciences',
    'Psychology',
    'Economics',
    'Mathematics'
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center space-x-2 mb-4">
        <Filter className="h-5 w-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900">Search & Filter Alumni</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Search */}
        <div className="xl:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search by Name
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Enter name..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Graduation Year */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Graduation Year
          </label>
          <select
            value={graduationYear}
            onChange={(e) => onGraduationYearChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">All Years</option>
            {years.map(year => (
              <option key={year} value={year.toString()}>{year}</option>
            ))}
          </select>
        </div>

        {/* Department */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Department
          </label>
          <select
            value={department}
            onChange={(e) => onDepartmentChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {/* Company */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company
          </label>
          <input
            type="text"
            value={company}
            onChange={(e) => onCompanyChange(e.target.value)}
            placeholder="Company name..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="name">Name</option>
            <option value="graduation_year">Graduation Year</option>
            <option value="created_at">Recently Joined</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default DirectoryFilters;