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
import { Plus, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const TeamManagementPage = () => {
  const { currentUser, userRole } = useAuth();
  const [teams, setTeams] = useState([]);
  const [teamMembers, setTeamMembers] = useState({});
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamLeader, setNewTeamLeader] = useState('');
  const [selectedMember, setSelectedMember] = useState('');

  const hasManagementAccess = userRole === 'admin' || userRole === 'sales_manager';

  useEffect(() => {
    if (hasManagementAccess || userRole === 'team_leader') {
      fetchTeams();
      fetchAvailableMembers();
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

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim() || !newTeamLeader) return;

    try {
      const leader = availableMembers.find(m => m.id === newTeamLeader);
      
      await addDoc(collection(db, 'teams'), {
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

      setSelectedMember('');
      setShowAddMember(false);
      fetchTeams();
    } catch (error) {
      console.error('Error adding member:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading teams...</p>
        </div>
      </div>
    );
  }

  if (!hasManagementAccess && userRole !== 'team_leader') {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-600">You don't have access to Team Management.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
        {hasManagementAccess && (
          <button
            onClick={() => setShowCreateTeam(!showCreateTeam)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <Plus className="w-5 h-5" />
            Create Team
          </button>
        )}
      </div>

      {/* Create Team Form */}
      {showCreateTeam && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Team</h2>
          <form onSubmit={handleCreateTeam} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team Name *
              </label>
              <input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Enter team name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team Leader *
              </label>
              <select
                value={newTeamLeader}
                onChange={(e) => setNewTeamLeader(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a team leader</option>
                {availableMembers.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.firstName} {member.lastName} ({member.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
              >
                Create Team
              </button>
              <button
                type="button"
                onClick={() => setShowCreateTeam(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg"
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
          <div className="col-span-full bg-gray-50 rounded-lg p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No teams found</p>
          </div>
        ) : (
          teams.map(team => (
            <div key={team.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{team.name}</h3>
                  <p className="text-sm text-gray-500">Led by {team.leaderName}</p>
                </div>
                <Users className="w-6 h-6 text-blue-500" />
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Members</p>
                  <p className="text-2xl font-bold text-gray-900">{team.memberCount || 0}/5</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Commission</p>
                  <p className="text-lg font-bold text-green-600">
                    ${(team.totalCommission || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Team Members */}
              <div className="border-t pt-4 mb-4">
                <h4 className="font-semibold text-gray-900 mb-3">Members</h4>
                <div className="space-y-2">
                  {(teamMembers[team.id] || []).map(member => (
                    <div key={member.id} className="p-2 bg-gray-50 rounded">
                      <p className="text-sm font-medium text-gray-900">{member.userName}</p>
                      <p className="text-xs text-gray-500">{member.userEmail}</p>
                    </div>
                  ))}
                  {(!teamMembers[team.id] || teamMembers[team.id].length === 0) && (
                    <p className="text-sm text-gray-500">No members yet</p>
                  )}
                </div>
              </div>

              {/* Add Member Button */}
              {(userRole === 'team_leader' || userRole === 'admin') && (team.memberCount || 0) < 5 && (
                <button
                  onClick={() => {
                    setSelectedTeam(team);
                    setShowAddMember(true);
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Member
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Member Modal */}
      {showAddMember && selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Add Member to {selectedTeam.name}</h2>
            </div>

            <form onSubmit={handleAddMember} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Member
                </label>
                <select
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddMember(false);
                    setSelectedMember('');
                    setSelectedTeam(null);
                  }}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
