import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Database } from '../lib/supabase';
import { Users, Briefcase, Calendar, TrendingUp, Plus } from 'lucide-react';
import ProfileCard from '../components/Profile/ProfileCard';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Job = Database['public']['Tables']['jobs']['Row'];

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recentAlumni, setRecentAlumni] = useState<Profile[]>([]);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState({
    totalAlumni: 0,
    activeJobs: 0,
    recentJoins: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch current user's profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch recent alumni (last 6)
      const { data: alumniData } = await supabase
        .from('profiles')
        .select('*')
        .eq('hidden_from_search', false)
        .order('created_at', { ascending: false })
        .limit(6);

      if (alumniData) {
        setRecentAlumni(alumniData);
      }

      // Fetch recent jobs
      const { data: jobsData } = await supabase
        .from('jobs')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5);

      if (jobsData) {
        setRecentJobs(jobsData);
      }

      // Fetch stats
      const [
        { count: totalAlumni },
        { count: activeJobs },
        { count: recentJoins }
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('hidden_from_search', false),
        supabase
          .from('jobs')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true),
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      ]);

      setStats({
        totalAlumni: totalAlumni || 0,
        activeJobs: activeJobs || 0,
        recentJoins: recentJoins || 0
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const fullName = profile ? `${profile.first_name} ${profile.last_name}` : 'Alumni';

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {fullName}!</h1>
        <p className="text-blue-100 mb-6">
          Stay connected with your alumni network and discover new opportunities.
        </p>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Alumni</p>
                <p className="text-2xl font-bold">{stats.totalAlumni}</p>
              </div>
              <Users className="h-8 w-8 text-blue-200" />
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Active Jobs</p>
                <p className="text-2xl font-bold">{stats.activeJobs}</p>
              </div>
              <Briefcase className="h-8 w-8 text-blue-200" />
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Recent Joins</p>
                <p className="text-2xl font-bold">{stats.recentJoins}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-200" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Alumni */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Alumni</h2>
            <a
              href="/directory"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
            >
              View All →
            </a>
          </div>
          
          {recentAlumni.length > 0 ? (
            <div className="space-y-4">
              {recentAlumni.slice(0, 3).map((alumnus) => (
                <div key={alumnus.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium text-sm">
                    {alumnus.first_name.charAt(0)}{alumnus.last_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {alumnus.first_name} {alumnus.last_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {alumnus.degree} • Class of {alumnus.graduation_year}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-4">No recent alumni to show.</p>
          )}
        </div>

        {/* Recent Job Opportunities */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Opportunities</h2>
            <a
              href="/jobs"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
            >
              View All →
            </a>
          </div>
          
          {recentJobs.length > 0 ? (
            <div className="space-y-4">
              {recentJobs.slice(0, 3).map((job) => (
                <div key={job.id} className="p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {job.title}
                      </h3>
                      <p className="text-sm text-gray-600">{job.company}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          job.job_type === 'full-time' ? 'bg-green-100 text-green-800' :
                          job.job_type === 'part-time' ? 'bg-blue-100 text-blue-800' :
                          job.job_type === 'internship' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {job.job_type}
                        </span>
                        {job.location && (
                          <span className="text-xs text-gray-500">{job.location}</span>
                        )}
                      </div>
                    </div>
                    <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-4">No recent job opportunities.</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href="/profile"
            className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
          >
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Update Profile</h3>
              <p className="text-sm text-gray-600">Edit your information</p>
            </div>
          </a>

          <a
            href="/directory"
            className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all group"
          >
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Browse Alumni</h3>
              <p className="text-sm text-gray-600">Find connections</p>
            </div>
          </a>

          <a
            href="/jobs"
            className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all group"
          >
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <Briefcase className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Post Opportunity</h3>
              <p className="text-sm text-gray-600">Share job openings</p>
            </div>
          </a>

          <a
            href="/settings"
            className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all group"
          >
            <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
              <Plus className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Privacy Settings</h3>
              <p className="text-sm text-gray-600">Manage visibility</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;