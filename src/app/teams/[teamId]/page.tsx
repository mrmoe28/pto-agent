'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, UserPlus, Search, Heart, Settings, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: string;
  status: string;
  invitedBy: string | null;
  joinedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface SharedSearch {
  id: string;
  teamId: string;
  sharedBy: string;
  searchQuery: string;
  searchResults: unknown[];
  title: string;
  description: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface SharedFavorite {
  id: string;
  teamId: string;
  permitOfficeId: string;
  addedBy: string;
  notes: string | null;
  tags: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface TeamPageProps {
  params: Promise<{
    teamId: string;
  }>;
}

export default function TeamDetailPage({ params }: TeamPageProps) {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoaded = status !== 'loading';
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [sharedSearches, setSharedSearches] = useState<SharedSearch[]>([]);
  const [sharedFavorites, setSharedFavorites] = useState<SharedFavorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<string>('free');
  const [userRole, setUserRole] = useState<string>('');
  const [teamId, setTeamId] = useState<string>('');

  const fetchTeamData = useCallback(async () => {
    try {
      // Fetch team members
      const membersResponse = await fetch(`/api/teams/${teamId}/members`);
      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        setMembers(membersData.members || []);
        
        // Find current user's role
        const currentUserMember = membersData.members.find((m: TeamMember) => m.userId === user?.id);
        if (currentUserMember) {
          setUserRole(currentUserMember.role);
        }
      }

      // Fetch shared searches
      const searchesResponse = await fetch(`/api/teams/${teamId}/shared-searches`);
      if (searchesResponse.ok) {
        const searchesData = await searchesResponse.json();
        setSharedSearches(searchesData.searches || []);
      }

      // Fetch shared favorites
      const favoritesResponse = await fetch(`/api/teams/${teamId}/shared-favorites`);
      if (favoritesResponse.ok) {
        const favoritesData = await favoritesResponse.json();
        setSharedFavorites(favoritesData.favorites || []);
      }

      // TODO: Implement real team data fetching from API
      // For production, this should fetch actual team data from the database
      setTeam(null);

    } catch (error) {
      console.error('Error fetching team data:', error);
    } finally {
      setLoading(false);
    }
  }, [teamId, user?.id]);

  useEffect(() => {
    const initializeParams = async () => {
      const resolvedParams = await params;
      setTeamId(resolvedParams.teamId);
    };
    initializeParams();
  }, [params]);

  useEffect(() => {
    if (isLoaded && user && teamId) {
      const subscriptionPlan = user?.subscriptionPlan as string;
      setUserPlan(subscriptionPlan || 'free');

      if (subscriptionPlan === 'enterprise') {
        fetchTeamData();
      } else {
        setLoading(false);
      }
    }
  }, [isLoaded, user, teamId, fetchTeamData]);

  const handleInviteMembers = () => {
    // TODO: Implement invite members functionality
    alert('Invite members functionality coming soon!');
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Enterprise Plan Required
          </h1>
          <p className="text-gray-600 mb-6">
            Team collaboration features require the Enterprise plan.
          </p>
          <Button onClick={() => router.push('/pricing')}>
            View Pricing Plans
          </Button>
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

  if (!team) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Team Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            The team you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
          </p>
          <Button onClick={() => router.push('/teams')}>
            Back to Teams
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/teams')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Teams
          </Button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
              <p className="text-gray-600 mt-2">
                {team.description || 'No description provided'}
              </p>
            </div>
            <div className="flex space-x-2">
              {['owner', 'admin'].includes(userRole) && (
                <Button onClick={handleInviteMembers} variant="outline">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Members
                </Button>
              )}
              {userRole === 'owner' && (
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              )}
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
            <TabsTrigger value="searches">Shared Searches ({sharedSearches.length})</TabsTrigger>
            <TabsTrigger value="favorites">Shared Favorites ({sharedFavorites.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{members.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Active team members
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Shared Searches</CardTitle>
                  <Search className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{sharedSearches.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Search results shared
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Shared Favorites</CardTitle>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{sharedFavorites.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Favorite offices shared
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  Manage your team members and their roles.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{member.userId}</p>
                          <p className="text-sm text-gray-500">
                            Joined {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'Recently'}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant={member.role === 'owner' ? 'default' : 'secondary'}
                      >
                        {member.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="searches" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Shared Searches</CardTitle>
                <CardDescription>
                  Search results shared by team members.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sharedSearches.length === 0 ? (
                  <div className="text-center py-8">
                    <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No shared searches yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sharedSearches.map((search) => (
                      <div key={search.id} className="p-4 border rounded-lg">
                        <h3 className="font-medium">{search.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{search.searchQuery}</p>
                        {search.description && (
                          <p className="text-sm text-gray-600 mt-2">{search.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          Shared by {search.sharedBy} • {new Date(search.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="favorites" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Shared Favorites</CardTitle>
                <CardDescription>
                  Favorite permit offices shared by team members.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sharedFavorites.length === 0 ? (
                  <div className="text-center py-8">
                    <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No shared favorites yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sharedFavorites.map((favorite) => (
                      <div key={favorite.id} className="p-4 border rounded-lg">
                        <h3 className="font-medium">Permit Office {favorite.permitOfficeId}</h3>
                        {favorite.notes && (
                          <p className="text-sm text-gray-600 mt-1">{favorite.notes}</p>
                        )}
                        {favorite.tags && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {favorite.tags.split(',').map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag.trim()}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          Added by {favorite.addedBy} • {new Date(favorite.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
