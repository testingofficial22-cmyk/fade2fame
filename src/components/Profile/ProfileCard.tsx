import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Briefcase, GraduationCap, Calendar, Mail, Phone, ExternalLink } from 'lucide-react';
import { Database } from '../../lib/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface ProfileCardProps {
  profile: Profile;
  isCurrentUser?: boolean;
  onViewProfile?: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, isCurrentUser = false, onViewProfile }) => {
  const navigate = useNavigate();
  const fullName = `${profile.first_name} ${profile.last_name}`;
  const graduationYear = profile.graduation_year;
  const currentJob = profile.job_title && profile.company 
    ? `${profile.job_title} at ${profile.company}`
    : profile.job_title || profile.company;

  const showEmail = profile.email_visibility === 'public' || isCurrentUser;
  const showPhone = profile.phone && (profile.phone_visibility === 'public' || isCurrentUser);
  const showLocation = profile.location && (profile.location_visibility === 'public' || isCurrentUser);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
      <div className="flex items-center space-x-4 mb-4">
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-xl">
          {profile.first_name.charAt(0)}{profile.last_name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {fullName}
          </h3>
          <p className="text-sm text-gray-600 flex items-center">
            <GraduationCap className="h-4 w-4 mr-1" />
            Class of {graduationYear}
          </p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <p className="text-sm text-gray-700 font-medium">{profile.degree}</p>
        <p className="text-sm text-gray-600">{profile.department}</p>
        
        {currentJob && (
          <p className="text-sm text-gray-700 flex items-center">
            <Briefcase className="h-4 w-4 mr-2 text-gray-400" />
            {currentJob}
          </p>
        )}

        {showLocation && (
          <p className="text-sm text-gray-600 flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
            {profile.location}
          </p>
        )}
      </div>

      {(showEmail || showPhone) && (
        <div className="border-t border-gray-100 pt-4 mb-4">
          <div className="space-y-2">
            {showEmail && (
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                <a 
                  href={`mailto:${profile.email}`}
                  className="hover:text-blue-600 transition-colors truncate"
                >
                  {profile.email}
                </a>
              </div>
            )}
            
            {showPhone && (
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="h-4 w-4 mr-2 text-gray-400" />
                <a 
                  href={`tel:${profile.phone}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  {profile.phone}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {onViewProfile && (
        <button
          onClick={() => navigate(`/profile/${profile.id}`)}
          className="w-full bg-gray-50 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-100 transition-all flex items-center justify-center space-x-2"
        >
          <span>View Profile</span>
          <ExternalLink className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default ProfileCard;