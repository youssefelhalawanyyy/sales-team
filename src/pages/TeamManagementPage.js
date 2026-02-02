import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc
} from 'firebase/firestore';
import { 
  Plus, 
  Users, 
  Crown, 
  Mail, 
  TrendingUp, 
  Award, 
  X,
  UserPlus,
  Sparkles,
  Shield,
  Target,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const TeamManagementPage = () => {
  const { currentUser, userRole } = useAuth();
  const [teams, setTeams] = useState([]);
  const [teamMembers, setTeamMembers] = useState({});
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [availableLeaders, setAvailableLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamLeader, setNewTeamLeader] = useState('');
  const [selectedMember, setSelectedMember] = useState('');

  const hasManagementAccess = userRole === 'admin' || userRole === 'sales_manager';

  useEffect(() => {
    if (hasManagementAccess || userRole === 'team_leader') {
      fetchTeams();
      fetchAvailableMembers();
      fetchAvailableLeaders();
    }
  }, [userRole, currentUser?.uid]);

  const fetchTeams = async () => {
    try {
      let teamsQuery;

      if (userRole === 'team_leader') {
        // Team leader sees only their team
        teamsQuery = query(
          collection(db, 'teams'),
          where('leaderId', '==', currentUser.uid)
        );
      } else {
        // Admin and sales manager see all teams
        teamsQuery = collection(db, 'teams');
      }

      const snapshot = await getDocs(teamsQuery);
      const teamsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setTeams(teamsList);

      // Fetch team members for each team
      const membersData = {};
      for (const team of teamsList) {
        const membersSnap = await getDocs(
          query(
            collection(db, 'teamMembers'),
            where('teamId', '==', team.id)
          )
        );
        membersData[team.id] = membersSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
      setTeamMembers(membersData);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableMembers = async () => {
    try {
      const membersSnap = await getDocs(
        query(
          collection(db, 'users'),
          where('role', '==', 'sales_member')
        )
      );
      setAvailableMembers(
        membersSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      );
    } catch (error) {
      console.error('Error fetching available members:', error);
    }
  };

  const fetchAvailableLeaders = async () => {
    try {
      const leadersSnap = await getDocs(
        query(
          collection(db, 'users'),
          where('role', '==', 'team_leader')
        )
      );
      setAvailableLeaders(
        leadersSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      );
    } catch (error) {
      console.error('Error fetching available leaders:', error);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim() || !newTeamLeader) return;

    try {
      const leader = availableLeaders.find(m => m.id === newTeamLeader);
      const teamRef = await addDoc(collection(db, 'teams'), {
        name: newTeamName,
        leaderId: newTeamLeader,
        leaderName: leader.firstName + ' ' + leader.lastName,
        leaderEmail: leader.email,
        createdAt: serverTimestamp(),
        memberCount: 1, // Include leader in count
        totalDeals: 0,
        totalCommission: 0,
        status: 'active'
      });

      await updateDoc(doc(db, 'users', newTeamLeader), {
        teamId: teamRef.id,
        teamName: newTeamName,
        teamRole: 'leader'
      });

      setNewTeamName('');
      setNewTeamLeader('');
      setShowCreateTeam(false);
      fetchTeams();
    } catch (error) {
      console.error('Error creating team:', error);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedTeam || !selectedMember) return;

    try {
      const member = availableMembers.find(m => m.id === selectedMember);

      await addDoc(collection(db, 'teamMembers'), {
        teamId: selectedTeam.id,
        userId: selectedMember,
        userName: member.firstName + ' ' + member.lastName,
        userEmail: member.email,
        addedAt: serverTimestamp(),
        status: 'active',
        dealsCount: 0,
        commission: 0
      });

      // Update team member count
      const teamRef = doc(db, 'teams', selectedTeam.id);
      const currentCount = (selectedTeam.memberCount || 0) + 1;
      await updateDoc(teamRef, {
        memberCount: currentCount
      });

      await updateDoc(doc(db, 'users', selectedMember), {
        teamId: selectedTeam.id,
        teamName: selectedTeam.name,
        teamRole: 'member'
      });

      setSelectedMember('');
      setShowAddMember(false);
      fetchTeams();
    } catch (error) {
      console.error('Error adding member:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-indigo-400 rounded-full animate-spin animation-delay-150"></div>
        </div>
        <p className="mt-6 text-gray-600 font-medium animate-pulse">Loading teams...</p>
      </div>
    );
  }

  if (!hasManagementAccess && userRole !== 'team_leader') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-md border-2 border-red-100">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access Team Management.</p>
        </div>
      </div>
    );
  }

  const totalMembers = teams.reduce((sum, team) => sum + (team.memberCount || 0), 0);
  const totalCommission = teams.reduce((sum, team) => sum + (team.totalCommission || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-10">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">

          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 lg:p-10 text-white shadow-2xl overflow-hidden animate-fadeInDown">
            
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-8 h-8 text-yellow-300" />
                  <h1 className="text-3xl lg:text-4xl font-bold">Team Management</h1>
                </div>
                <p className="text-blue-100 text-sm lg:text-base">Manage teams, members, and track performance</p>
                
                {/* Stats */}
                <div className="flex flex-wrap gap-4 mt-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                    <Users className="w-4 h-4" />
                    <span className="text-sm font-semibold">{teams.length} Teams</span>
                  </div>
                  
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                    <UserPlus className="w-4 h-4" />
                    <span className="text-sm font-semibold">{totalMembers} Members</span>
                  </div>

                  <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm font-semibold">${totalCommission.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {hasManagementAccess && (
                <button
                  onClick={() => {
                    setShowCreateTeam(!showCreateTeam);
                  }}
                  className="group relative bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-3 rounded-2xl flex items-center gap-3 transition-all duration-300 border border-white/30 shadow-lg hover:shadow-2xl transform hover:scale-105 active:scale-95"
                >
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Plus className="w-5 h-5" strokeWidth={2.5} />
                  </div>
                  <span className="font-semibold">Create Team</span>
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-2xl"></div>
                </button>
              )}
            </div>
          </div>

          {/* Create Team Form */}
          {showCreateTeam && (
            <div className="bg-white rounded-3xl shadow-2xl border-2 border-blue-100 overflow-hidden animate-scaleIn">
              
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-8 py-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Create New Team</h2>
                </div>
                
                <button
                  type="button"
                  onClick={() => setShowCreateTeam(false)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors duration-200"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              <form onSubmit={handleCreateTeam} className="p-8 space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Team Name *
                    </label>
                    <div className="relative">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        placeholder="Enter team name"
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all duration-200 font-medium"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Team Leader *
                    </label>
                    <div className="relative">
                      <Crown className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        value={newTeamLeader}
                        onChange={(e) => setNewTeamLeader(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all duration-200 font-medium appearance-none"
                        required
                      >
                        <option value="">Select a team leader</option>
                        {availableLeaders.map(leader => (
                          <option key={leader.id} value={leader.id}>
                            {leader.firstName} {leader.lastName} ({leader.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
                  >
                    Create Team
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setShowCreateTeam(false)}
                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-2xl transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>

              </form>
            </div>
          )}

          {/* Teams Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {teams.length === 0 ? (
              <div className="col-span-full bg-white rounded-3xl shadow-lg p-12 text-center border border-gray-100">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-10 h-10 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Teams Yet</h3>
                <p className="text-gray-600 mb-6">Create your first team to get started</p>
                {hasManagementAccess && (
                  <button
                    onClick={() => setShowCreateTeam(true)}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg transition-all duration-300 transform hover:scale-105"
                  >
                    <Plus className="w-5 h-5" />
                    Create Team
                  </button>
                )}
              </div>
            ) : (
              teams.map((team, idx) => {
                const memberCount = team.memberCount || 0;
                const maxMembers = 5;
                const fillPercentage = (memberCount / maxMembers) * 100;
                
                return (
                  <div 
                    key={team.id} 
                    className="group relative bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-1 animate-scaleIn"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    
                    {/* Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    {/* Header */}
                    <div className="relative bg-gradient-to-r from-blue-500 to-indigo-500 p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-1">{team.name}</h3>
                          <div className="flex items-center gap-2 text-blue-100 text-sm">
                            <Crown className="w-4 h-4" />
                            <span className="font-medium">{team.leaderName}</span>
                          </div>
                        </div>
                        
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                          <Users className="w-6 h-6 text-white" strokeWidth={2.5} />
                        </div>
                      </div>

                      {/* Member Progress */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-white text-sm">
                          <span className="font-semibold">Team Size</span>
                          <span className="font-bold">{memberCount}/{maxMembers}</span>
                        </div>
                        <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-white rounded-full transition-all duration-500"
                            style={{ width: `${fillPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="relative p-6 space-y-4">

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4">
                        
                        <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100">
                          <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <p className="text-xs text-green-700 font-semibold uppercase tracking-wide">Commission</p>
                          </div>
                          <p className="text-xl font-bold text-green-600">
                            ${(team.totalCommission || 0).toLocaleString()}
                          </p>
                        </div>

                        <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-100">
                          <div className="flex items-center gap-2 mb-1">
                            <Target className="w-4 h-4 text-blue-600" />
                            <p className="text-xs text-blue-700 font-semibold uppercase tracking-wide">Deals</p>
                          </div>
                          <p className="text-xl font-bold text-blue-600">
                            {team.totalDeals || 0}
                          </p>
                        </div>

                      </div>

                      {/* Team Members */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Users className="w-4 h-4 text-gray-500" />
                          <h4 className="font-bold text-gray-900">Team Members</h4>
                        </div>
                        
                        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                          {(teamMembers[team.id] || []).length > 0 ? (
                            teamMembers[team.id].map((member, mIdx) => (
                              <div 
                                key={member.id} 
                                className="group/member p-3 bg-gradient-to-r from-gray-50 to-blue-50 hover:from-blue-50 hover:to-indigo-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-all duration-200"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md">
                                    {member.userName?.charAt(0).toUpperCase()}
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                      {member.userName}
                                    </p>
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                      <Mail className="w-3 h-3" />
                                      <span className="truncate">{member.userEmail}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-6 text-gray-500 text-sm">
                              <UserPlus className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                              <p>No members yet</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Add Member Button */}
                      {(userRole === 'team_leader' || userRole === 'admin') && memberCount < maxMembers && (
                        <button
                          onClick={() => {
                            setSelectedTeam(team);
                            setShowAddMember(true);
                          }}
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-3 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                        >
                          <UserPlus className="w-5 h-5" strokeWidth={2.5} />
                          Add Member
                        </button>
                      )}

                      {/* Full Team Badge */}
                      {memberCount >= maxMembers && (
                        <div className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl">
                          <Award className="w-5 h-5 text-yellow-600" />
                          <span className="text-sm font-bold text-yellow-700">Team Full</span>
                        </div>
                      )}

                    </div>

                    {/* Shine Effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"></div>

                  </div>
                );
              })
            )}

          </div>

        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMember && selectedTeam && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-scaleIn">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-8 py-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <UserPlus className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Add Member</h2>
                  <p className="text-green-100 text-sm">to {selectedTeam.name}</p>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => {
                  setShowAddMember(false);
                  setSelectedMember('');
                  setSelectedTeam(null);
                }}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors duration-200"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAddMember} className="p-8 space-y-6">
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Select Member *
                </label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={selectedMember}
                    onChange={(e) => setSelectedMember(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-green-500 focus:bg-white transition-all duration-200 font-medium appearance-none"
                    required
                  >
                    <option value="">Choose a member...</option>
                    {availableMembers.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.firstName} {member.lastName} ({member.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddMember(false);
                    setSelectedMember('');
                    setSelectedTeam(null);
                  }}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-2xl transition-all duration-200"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
                >
                  Add Member
                </button>
              </div>

            </form>
          </div>

        </div>
      )}

      {/* Styles */}
      <style>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fadeInDown {
          animation: fadeInDown 0.6s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out forwards;
          opacity: 0;
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animation-delay-150 {
          animation-delay: 150ms;
        }

        /* Custom Scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>

    </div>
  );
};

// Default export for lazy loading
export default TeamManagementPage;
