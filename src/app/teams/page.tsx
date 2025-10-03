'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Users, Heart, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Team {
  team: {
    id: string;
    name: string;
    description: string | null;
    ownerId: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  memberRole: string;
  memberStatus: string;
  joinedAt: Date | null;
}

export default function TeamsPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoaded = status !== 'loading';
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<string>('free');

  useEffect(() => {
    if (isLoaded && user) {
      const subscriptionPlan = user?.subscriptionPlan as string;
      setUserPlan(subscriptionPlan || 'free');

      if (subscriptionPlan === 'enterprise') {
        fetchTeams();
      } else {
        setLoading(false);
      }
    }
  }, [isLoaded, user]);

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      if (response.ok) {
        const data = await response.json();
        setTeams(data.teams || []);
      } else if (response.status === 403) {
        // User doesn't have Enterprise plan
        setUserPlan('free');
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = () => {
    router.push('/teams/create');
  };

  const handleTeamClick = (teamId: string) => {
    router.push(`/teams/${teamId}`);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.push('/sign-in');
    return null;
  }

  if (userPlan !== 'enterprise') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Team Collaboration
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Team collaboration features are available with the Enterprise plan.
            </p>
            <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto">
              <Users className="h-16 w-16 text-purple-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Upgrade to Enterprise
              </h2>
              <p className="text-gray-600 mb-6">
                Get access to team collaboration, shared searches, and more.
              </p>
              <Button 
                onClick={() => router.push('/pricing')}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                View Pricing Plans
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
            <p className="text-gray-600 mt-2">
              Collaborate with your team on permit searches and favorites
            </p>
          </div>
          <Button onClick={handleCreateTeam} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Create Team
          </Button>
        </div>

        {teams.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No teams yet
            </h2>
            <p className="text-gray-600 mb-6">
              Create your first team to start collaborating with colleagues.
            </p>
            <Button onClick={handleCreateTeam} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Team
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <Card 
                key={team.team.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
                onClick={() => handleTeamClick(team.team.id)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{team.team.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {team.team.description || 'No description'}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant={team.memberRole === 'owner' ? 'default' : 'secondary'}
                      className="ml-2"
                    >
                      {team.memberRole}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      <span>Team Member</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Search className="h-4 w-4 mr-2" />
                      <span>Shared Searches</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Heart className="h-4 w-4 mr-2" />
                      <span>Shared Favorites</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-4">
                      Joined {team.joinedAt ? new Date(team.joinedAt).toLocaleDateString() : 'Recently'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
