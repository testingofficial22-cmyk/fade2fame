import React, { useState, useEffect } from 'react';
import { supabase, Database } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import DirectoryFilters from '../components/Directory/DirectoryFilters';
import ProfileCard from '../components/Profile/ProfileCard';
import { Users } from 'lucide-react';

type Profile = Database['public']['Tables']['profiles']['Row'];

const DirectoryPage: React.FC = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [department, setDepartment] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    filterAndSortProfiles();
  }, [profiles, searchTerm, graduationYear, department, company, location, sortBy]);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('hidden_from_search', false);

      if (error) {
        console.error('Error fetching profiles:', error);
        return;
      }

      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProfiles = () => {
    let filtered = [...profiles];

    // Apply filters
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(profile =>
        profile.first_name.toLowerCase().includes(search) ||
        profile.last_name.toLowerCase().includes(search)
      );
    }

    if (graduationYear) {
      filtered = filtered.filter(profile =>
        profile.graduation_year.toString() === graduationYear
      );
    }

    if (department) {
      filtered = filtered.filter(profile =>
        profile.department.toLowerCase().includes(department.toLowerCase())
      );
    }

    if (company) {
      filtered = filtered.filter(profile =>
        profile.company?.toLowerCase().includes(company.toLowerCase())
      );
    }

    if (location) {
      filtered = filtered.filter(profile =>
        profile.location?.toLowerCase().includes(location.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
        case 'graduation_year':
          return b.graduation_year - a.graduation_year; // Newest first
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); // Newest first
        default:
          return 0;
      }
    });

    setFilteredProfiles(filtered);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3">
          <Users className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Alumni Directory</h1>
            <p className="text-gray-600">
              Connect with {filteredProfiles.length} alumni from your network
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <DirectoryFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        graduationYear={graduationYear}
        onGraduationYearChange={setGraduationYear}
        department={department}
        onDepartmentChange={setDepartment}
        company={company}
        onCompanyChange={setCompany}
        location={location}
        onLocationChange={setLocation}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {/* Results */}
      {filteredProfiles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              isCurrentUser={profile.id === user?.id}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Alumni Found</h3>
          <p className="text-gray-600 mb-6">
            No alumni match your current search criteria. Try adjusting your filters.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setGraduationYear('');
              setDepartment('');
              setCompany('');
              setLocation('');
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default DirectoryPage;