import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Heart, 
  Settings,
  Camera,
  Users,
  MessageCircle,
  UserMinus,
  UserPlus,
  Clock,
  Trash2,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import EditProfileModal from '../components/Profile/EditProfileModal';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  photo_url?: string;
  date_of_birth?: string;
  gender?: string;
  graduation_year?: number;
  degree: string;
  department: string;
  roll_number?: string;
  cgpa?: number;
  job_title?: string;
  company?: string;
  industry?: string;
  location?: string;
  experience_years?: number;
  linkedin_url?: string;
  bio?: string;
  achievements?: string[];
  skills?: string[];
  hobbies?: string[];
  phone_visibility: string;
  email_visibility: string;
  location_visibility: string;
  hidden_from_search: boolean;
  role: string;
  created_at: string;
}

interface Job {
  id: string;
  title: string;
  company: string;
  location?: string;
  description: string;
  job_type: string;
  application_url?: string;
  created_at: string;
}

interface Connection {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  requester?: Profile;
  addressee?: Profile;
}

const ProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userJobs, setUserJobs] = useState<Job[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>('none');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteJobId, setDeleteJobId] = useState<string | null>(null);

  const isOwnProfile = user?.id === id;

  useEffect(() => {
    if (id) {
      fetchProfile();
      fetchUserJobs();
      if (user?.id && !isOwnProfile) {
        fetchConnectionStatus();
      }
      if (isOwnProfile) {
        fetchConnections();
      }
    }
  }, [id, user?.id]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('posted_by', id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserJobs(data || []);
    } catch (error) {
      console.error('Error fetching user jobs:', error);
    }
  };

  const fetchConnectionStatus = async () => {
    if (!user?.id || !id) return;

    try {
      const { data, error } = await supabase
        .from('connections')
        .select('*')
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${id}),and(requester_id.eq.${id},addressee_id.eq.${user.id})`)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        if (data.status === 'accepted') {
          setConnectionStatus('connected');
        } else if (data.requester_id === user.id) {
          setConnectionStatus('sent');
        } else {
          setConnectionStatus('received');
        }
      } else {
        setConnectionStatus('none');
      }
    } catch (error) {
      console.error('Error fetching connection status:', error);
    }
  };

  const fetchConnections = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('connections')
        .select(`
          *,
          requester:profiles!connections_requester_id_fkey(*),
          addressee:profiles!connections_addressee_id_fkey(*)
        `)
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConnections(data || []);
    } catch (error) {
      console.error('Error fetching connections:', error);
    }
  };

  const handleConnect = async () => {
    if (!user?.id || !id) return;

    try {
      const { error } = await supabase
        .from('connections')
        .insert({
          requester_id: user.id,
          addressee_id: id,
          status: 'pending'
        });

      if (error) throw error;
      setConnectionStatus('sent');
    } catch (error) {
      console.error('Error sending connection request:', error);
    }
  };

  const handleAcceptConnection = async () => {
    if (!user?.id || !id) return;

    try {
      const { error } = await supabase
        .from('connections')
        .update({ status: 'accepted' })
        .eq('requester_id', id)
        .eq('addressee_id', user.id);

      if (error) throw error;
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Error accepting connection:', error);
    }
  };

  const handleRemoveConnection = async () => {
    if (!user?.id || !id) return;

    try {
      const { error } = await supabase
        .from('connections')
        .delete()
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${id}),and(requester_id.eq.${id},addressee_id.eq.${user.id})`);

      if (error) throw error;
      setConnectionStatus('none');
    } catch (error) {
      console.error('Error removing connection:', error);
    }
  };

  const handleMessage = () => {
    navigate('/messages', { state: { selectedUserId: id } });
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ is_active: false })
        .eq('id', jobId);

      if (error) throw error;
      
      setUserJobs(prev => prev.filter(job => job.id !== jobId));
      setDeleteJobId(null);
    } catch (error) {
      console.error('Error deleting job:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  const shouldShowField = (visibility: string) => {
    if (isOwnProfile) return true;
    if (visibility === 'public') return true;
    if (visibility === 'alumni' && user) return true;
    return false;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile not found</h2>
          <p className="text-gray-600">The profile you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'about', label: 'About', icon: User },
    { id: 'academic', label: 'Academic', icon: GraduationCap },
    { id: 'professional', label: 'Professional', icon: Briefcase },
    { id: 'achievements', label: 'Achievements', icon: Award },
    ...(isOwnProfile && userJobs.length > 0 ? [{ id: 'jobs', label: 'My Job Posts', icon: Briefcase }] : []),
    ...(isOwnProfile ? [{ id: 'connections', label: 'Connections', icon: Users }] : [])
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover/Header Area */}
      <div className="relative h-64 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
      </div>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
            {/* Profile Picture */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                {profile.photo_url ? (
                  <img
                    src={profile.photo_url}
                    alt={`${profile.first_name} ${profile.last_name}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-gray-500" />
                )}
              </div>
              {isOwnProfile && (
                <button className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {profile.first_name} {profile.last_name}
              </h1>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  profile.role === 'alumni' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {profile.role === 'alumni' ? 'Alumni' : 'Student'}
                </span>
                {profile.job_title && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                    {profile.job_title}
                  </span>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                {isOwnProfile ? (
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <>
                    {connectionStatus === 'none' && (
                      <button
                        onClick={handleConnect}
                        className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Connect</span>
                      </button>
                    )}
                    {connectionStatus === 'sent' && (
                      <button
                        disabled
                        className="flex items-center space-x-2 bg-gray-400 text-white px-4 py-2 rounded-lg cursor-not-allowed"
                      >
                        <Clock className="w-4 h-4" />
                        <span>Request Sent</span>
                      </button>
                    )}
                    {connectionStatus === 'received' && (
                      <button
                        onClick={handleAcceptConnection}
                        className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Accept Request</span>
                      </button>
                    )}
                    {connectionStatus === 'connected' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={handleMessage}
                          className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Message</span>
                        </button>
                        <button
                          onClick={handleRemoveConnection}
                          className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <UserMinus className="w-4 h-4" />
                          <span>Remove</span>
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'about' && (
              <div className="space-y-6">
                {profile.bio && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Bio</h3>
                    <p className="text-gray-700">{profile.bio}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                    <div className="space-y-3">
                      {shouldShowField(profile.email_visibility) && (
                        <div className="flex items-center space-x-3">
                          <Mail className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-700">{profile.email}</span>
                        </div>
                      )}
                      {profile.phone && shouldShowField(profile.phone_visibility) && (
                        <div className="flex items-center space-x-3">
                          <Phone className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-700">{profile.phone}</span>
                        </div>
                      )}
                      {profile.date_of_birth && (
                        <div className="flex items-center space-x-3">
                          <Calendar className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-700">
                            {new Date(profile.date_of_birth).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {profile.location && shouldShowField(profile.location_visibility) && (
                        <div className="flex items-center space-x-3">
                          <MapPin className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-700">{profile.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'academic' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Degree</span>
                        <p className="text-gray-900">{profile.degree}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Department</span>
                        <p className="text-gray-900">{profile.department}</p>
                      </div>
                      {profile.roll_number && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Roll Number</span>
                          <p className="text-gray-900">{profile.roll_number}</p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      {profile.graduation_year && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Graduation Year</span>
                          <p className="text-gray-900">{profile.graduation_year}</p>
                        </div>
                      )}
                      {profile.cgpa && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">CGPA</span>
                          <p className="text-gray-900">{profile.cgpa}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'professional' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      {profile.job_title && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Job Title</span>
                          <p className="text-gray-900">{profile.job_title}</p>
                        </div>
                      )}
                      {profile.company && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Company</span>
                          <p className="text-gray-900">{profile.company}</p>
                        </div>
                      )}
                      {profile.industry && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Industry</span>
                          <p className="text-gray-900">{profile.industry}</p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      {profile.experience_years && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Experience</span>
                          <p className="text-gray-900">{profile.experience_years} years</p>
                        </div>
                      )}
                      {profile.linkedin_url && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">LinkedIn</span>
                          <a
                            href={profile.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800"
                          >
                            View Profile
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'achievements' && (
              <div className="space-y-6">
                {profile.achievements && profile.achievements.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Achievements</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.achievements.map((achievement, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm"
                        >
                          {achievement}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {profile.skills && profile.skills.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {profile.hobbies && profile.hobbies.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Hobbies</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.hobbies.map((hobby, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center space-x-1"
                        >
                          <Heart className="w-3 h-3" />
                          <span>{hobby}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'jobs' && isOwnProfile && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">My Job Posts</h3>
                  <span className="text-sm text-gray-500">{userJobs.length} active posts</span>
                </div>
                
                {userJobs.length === 0 ? (
                  <div className="text-center py-8">
                    <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No job posts yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userJobs.map((job) => (
                      <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="text-lg font-semibold text-gray-900">{job.title}</h4>
                              <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs font-medium">
                                {job.job_type}
                              </span>
                            </div>
                            <p className="text-gray-700 font-medium mb-1">{job.company}</p>
                            {job.location && (
                              <p className="text-gray-500 text-sm mb-2 flex items-center">
                                <MapPin className="w-4 h-4 mr-1" />
                                {job.location}
                              </p>
                            )}
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{job.description}</p>
                            <p className="text-xs text-gray-400">
                              Posted on {new Date(job.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => setDeleteJobId(job.id)}
                            className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete job post"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'connections' && isOwnProfile && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Connections</h3>
                  <span className="text-sm text-gray-500">{connections.length} connections</span>
                </div>
                
                {connections.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No connections yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {connections.map((connection) => {
                      const connectedUser = connection.requester_id === user?.id 
                        ? connection.addressee 
                        : connection.requester;
                      
                      if (!connectedUser) return null;
                      
                      return (
                        <div key={connection.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                              {connectedUser.photo_url ? (
                                <img
                                  src={connectedUser.photo_url}
                                  alt={`${connectedUser.first_name} ${connectedUser.last_name}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-6 h-6 text-gray-500" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">
                                {connectedUser.first_name} {connectedUser.last_name}
                              </h4>
                              <p className="text-sm text-gray-500">
                                Connected since {formatDate(connection.created_at)}
                              </p>
                              {connectedUser.job_title && (
                                <p className="text-sm text-gray-600">{connectedUser.job_title}</p>
                              )}
                            </div>
                            <button
                              onClick={() => navigate(`/profile/${connectedUser.id}`)}
                              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                            >
                              View Profile
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <EditProfileModal
          profile={profile}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={(updatedProfile) => {
            setProfile(updatedProfile);
            setIsEditModalOpen(false);
          }}
        />
      )}

      {/* Delete Job Confirmation Modal */}
      {deleteJobId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Delete Job Post</h3>
              <button
                onClick={() => setDeleteJobId(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this job post? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setDeleteJobId(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteJob(deleteJobId)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;