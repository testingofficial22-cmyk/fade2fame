import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Database } from '../lib/supabase';
import { 
  Edit, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Calendar, 
  Mail, 
  Phone, 
  Award,
  User,
  Building,
  Hash,
  Camera,
  X,
  Save,
  AlertCircle,
  UserPlus,
  UserCheck,
  UserX,
  MessageCircle,
  Users
} from 'lucide-react';
import EditProfileModal from '../components/Profile/EditProfileModal';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Job = Database['public']['Tables']['jobs']['Row'];
type Connection = Database['public']['Tables']['connections']['Row'];

const ProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTab, setActiveTab] = useState('about');
  const [userJobs, setUserJobs] = useState<Job[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'accepted' | 'sent'>('none');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [connectionLoading, setConnectionLoading] = useState(false);

  const isOwnProfile = user?.id === id;

  useEffect(() => {
    if (id) {
      fetchProfile();
      if (user && !isOwnProfile) {
        checkConnectionStatus();
      }
      if (isOwnProfile) {
        fetchConnections();
      }
      if (isOwnProfile) {
        fetchUserJobs();
      }
    }
  }, [id, user, isOwnProfile]);

  const fetchProfile = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkConnectionStatus = async () => {
    if (!user || !id) return;

    try {
      const { data, error } = await supabase
        .from('connections')
        .select('*')
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${id}),and(requester_id.eq.${id},addressee_id.eq.${user.id})`)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking connection status:', error);
        return;
      }

      if (data) {
        if (data.status === 'accepted') {
          setConnectionStatus('accepted');
        } else if (data.requester_id === user.id) {
          setConnectionStatus('sent');
        } else {
          setConnectionStatus('pending');
        }
      } else {
        setConnectionStatus('none');
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
    }
  };

  const fetchConnections = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('connections')
        .select(`
          *,
          requester:requester_id (first_name, last_name, photo_url),
          addressee:addressee_id (first_name, last_name, photo_url)
        `)
        .eq('status', 'accepted')
        .or(`requester_id.eq.${id},addressee_id.eq.${id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching connections:', error);
        return;
      }

      setConnections(data || []);
    } catch (error) {
      console.error('Error fetching connections:', error);
    }
  };

  const fetchUserJobs = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('posted_by', id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user jobs:', error);
        return;
      }

      setUserJobs(data || []);
    } catch (error) {
      console.error('Error fetching user jobs:', error);
    }
  };

  const handleProfileUpdate = (updatedProfile: Profile) => {
    setProfile(updatedProfile);
    setShowEditModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
        <p className="text-gray-600">The profile you're looking for doesn't exist.</p>
      </div>
    );
  }

  const fullName = `${profile.first_name} ${profile.last_name}`;
  const showEmail = profile.email_visibility === 'public' || isOwnProfile;
  const showPhone = profile.phone && (profile.phone_visibility === 'public' || isOwnProfile);
  const showLocation = profile.location && (profile.location_visibility === 'public' || isOwnProfile);

  const tabs = [
    { id: 'about', label: 'About', icon: User },
    { id: 'academic', label: 'Academic', icon: GraduationCap },
    { id: 'professional', label: 'Professional', icon: Briefcase },
    { id: 'achievements', label: 'Achievements', icon: Award },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Cover/Header Area */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl relative overflow-hidden">
        <div className="h-48 md:h-64 relative">
          {/* Cover Photo Placeholder */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-600/20"></div>
          
          {/* Profile Picture */}
          <div className="absolute -bottom-16 left-8">
            <div className="relative">
              <div className="h-32 w-32 rounded-full bg-white p-1 shadow-lg">
                {profile.photo_url ? (
                  <img
                    src={profile.photo_url}
                    alt={fullName}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-2xl">
                    {profile.first_name.charAt(0)}{profile.last_name.charAt(0)}
                  </div>
                )}
              </div>
              {isOwnProfile && (
                <button className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors">
                  <Camera className="h-4 w-4 text-gray-600" />
                </button>
              )}
            </div>
          </div>

          {/* Edit Profile Button */}
          {isOwnProfile && (
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setShowEditModal(true)}
                className="bg-white/90 backdrop-blur-sm text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-white transition-all flex items-center space-x-2"
              >
                <Edit className="h-4 w-4" />
                <span>Edit Profile</span>
              </button>
            </div>
          )}
        </div>

        {/* Basic Info */}
        <div className="pt-20 pb-6 px-8">
          <h1 className="text-3xl font-bold text-white mb-2">{fullName}</h1>
          <div className="flex flex-wrap items-center gap-4 text-blue-100">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-4 w-4" />
              <span>{profile.role === 'student' ? 'Student' : 'Alumni'}</span>
            </div>
            {profile.graduation_year && (
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Class of {profile.graduation_year}</span>
              </div>
            )}
            {profile.company && (
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4" />
                <span>{profile.company}</span>
              </div>
            )}
            {showLocation && (
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>{profile.location}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-blue-600'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {activeTab === 'about' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {showEmail && (
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{profile.email}</p>
                    </div>
                  </div>
                )}
                {showPhone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium">{profile.phone}</p>
                    </div>
                  </div>
                )}
                {profile.date_of_birth && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Date of Birth</p>
                      <p className="font-medium">
                        {new Date(profile.date_of_birth).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
                {profile.gender && (
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Gender</p>
                      <p className="font-medium capitalize">{profile.gender}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {profile.bio && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Bio</h3>
                <p className="text-gray-700">{profile.bio}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'academic' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Course/Degree</p>
                <p className="font-medium text-gray-900">{profile.degree}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Department</p>
                <p className="font-medium text-gray-900">{profile.department}</p>
              </div>
              {profile.graduation_year && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Graduation Year</p>
                  <p className="font-medium text-gray-900">{profile.graduation_year}</p>
                </div>
              )}
              {profile.roll_number && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Roll Number</p>
                  <p className="font-medium text-gray-900">{profile.roll_number}</p>
                </div>
              )}
              {profile.cgpa && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">CGPA</p>
                  <p className="font-medium text-gray-900">{profile.cgpa}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'professional' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Information</h3>
            {profile.role === 'alumni' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {profile.job_title && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Job Title</p>
                    <p className="font-medium text-gray-900">{profile.job_title}</p>
                  </div>
                )}
                {profile.company && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Company</p>
                    <p className="font-medium text-gray-900">{profile.company}</p>
                  </div>
                )}
                {profile.industry && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Industry</p>
                    <p className="font-medium text-gray-900">{profile.industry}</p>
                  </div>
                )}
                {showLocation && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Location</p>
                    <p className="font-medium text-gray-900">{profile.location}</p>
                  </div>
                )}
                {profile.experience_years && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Experience</p>
                    <p className="font-medium text-gray-900">{profile.experience_years} years</p>
                  </div>
                )}
                {profile.linkedin_url && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">LinkedIn</p>
                    <a
                      href={profile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:text-blue-700"
                    >
                      View Profile
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-600 italic">Professional information will be available after graduation.</p>
            )}
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Achievements & Skills</h3>
            
            {profile.achievements && profile.achievements.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Achievements</h4>
                <ul className="space-y-2">
                  {profile.achievements.map((achievement, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <Award className="h-4 w-4 text-yellow-500 mt-1 flex-shrink-0" />
                      <span className="text-gray-700">{achievement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {profile.skills && profile.skills.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {profile.hobbies && profile.hobbies.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Hobbies & Interests</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.hobbies.map((hobby, index) => (
                    <span
                      key={index}
                      className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {hobby}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(!profile.achievements || profile.achievements.length === 0) &&
             (!profile.skills || profile.skills.length === 0) &&
             (!profile.hobbies || profile.hobbies.length === 0) && (
              <p className="text-gray-600 italic">No achievements, skills, or hobbies added yet.</p>
            )}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEditModal(false)}
          onSave={handleProfileUpdate}
        />
      )}
    </div>
  );
};

export default ProfilePage;