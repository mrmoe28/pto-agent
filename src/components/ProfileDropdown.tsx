'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Settings, LogOut, Crown, UserCircle, Shield, Clock } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function ProfileDropdown() {
  const { data: session } = useSession()
  const router = useRouter()
  const user = session?.user

  if (!user) return null

  // Get user initials from name or email
  const getInitials = () => {
    if (user.name) {
      const nameParts = user.name.split(' ')
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
      }
      return user.name.substring(0, 2).toUpperCase()
    }
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase()
    }
    return 'U'
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full p-0 hover:bg-gray-100"
        >
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold text-sm">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72 p-4" align="end" forceMount>
        <div className="flex flex-col space-y-4">
          {/* User Info Section */}
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold text-base">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user.email}
              </p>
              <Badge
                variant="secondary"
                className="mt-1 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 w-fit"
              >
                <Crown className="h-3 w-3 mr-1" />
                Premium User
              </Badge>
            </div>
          </div>

          <DropdownMenuSeparator className="my-2" />

          {/* Menu Items */}
          <div className="flex flex-col space-y-1">
            <DropdownMenuItem
              onClick={() => router.push('/profile')}
              className="cursor-pointer py-2"
            >
              <UserCircle className="h-4 w-4 mr-2" />
              Profile
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => router.push('/settings')}
              className="cursor-pointer py-2"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => router.push('/activity')}
              className="cursor-pointer py-2"
            >
              <Clock className="h-4 w-4 mr-2" />
              Recent Activity
            </DropdownMenuItem>

            {(user as { subscriptionPlan?: string })?.subscriptionPlan === 'admin' && (
              <DropdownMenuItem
                onClick={() => router.push('/admin/subscription')}
                className="cursor-pointer py-2"
              >
                <Shield className="h-4 w-4 mr-2" />
                Admin Panel
              </DropdownMenuItem>
            )}
          </div>

          <DropdownMenuSeparator className="my-2" />

          {/* Sign Out Button */}
          <Button
            onClick={() => signOut({ callbackUrl: '/' })}
            variant="outline"
            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
