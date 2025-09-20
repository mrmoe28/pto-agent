'use client'

import Link from 'next/link'
import { useUser, SignOutButton } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Settings, User, Heart, Users, Download, Key, BarChart3, Palette, GraduationCap, Shield, Menu, X } from 'lucide-react'

export default function Navigation() {
  const { isSignedIn, user, isLoaded } = useUser()
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-blue-600">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">PTO Agent</span>
            </Link>
          </div>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link
                href="/"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 hover:bg-gray-100"
              >
                Home
              </Link>
              <Link
                href="/search"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 hover:bg-gray-100"
              >
                Search
              </Link>
              <Link
                href="/pricing"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 hover:bg-gray-100"
              >
                Pricing
              </Link>
              {mounted && isLoaded && isSignedIn && (
                <>
                  <Link
                    href="/dashboard"
                    className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 hover:bg-gray-100"
                  >
                    Dashboard
                  </Link>
                  {user?.publicMetadata?.subscriptionPlan === 'enterprise' && (
                    <>
                      <Link
                        href="/favorites"
                        className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 hover:bg-gray-100"
                      >
                        Favorites
                      </Link>
                      <Link
                        href="/teams"
                        className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 hover:bg-gray-100"
                      >
                        Teams
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-600 hover:text-gray-900"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </Button>
          </div>

          {/* Authentication Buttons */}
          <div className="flex items-center space-x-4 relative z-10">
            {!mounted || !isLoaded ? (
              <div className="flex items-center space-x-3">
                <div className="w-20 h-8 bg-gray-200 animate-pulse rounded"></div>
                <div className="w-16 h-8 bg-gray-200 animate-pulse rounded"></div>
              </div>
            ) : isSignedIn ? (
              <div className="flex items-center space-x-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.imageUrl} alt={user?.firstName || 'User'} />
                        <AvatarFallback>
                          {user?.firstName?.charAt(0) || user?.emailAddresses[0]?.emailAddress?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user?.firstName || 'User'}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.emailAddresses[0]?.emailAddress}
                        </p>
                        <Badge variant="secondary" className="w-fit text-xs">
                          {String(user?.publicMetadata?.subscriptionPlan || 'free')}
                        </Badge>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {user?.publicMetadata?.subscriptionPlan === 'enterprise' && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/favorites" className="flex items-center">
                            <Heart className="mr-2 h-4 w-4" />
                            <span>Favorites</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/teams" className="flex items-center">
                            <Users className="mr-2 h-4 w-4" />
                            <span>Teams</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/settings" className="flex items-center">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/settings/api" className="flex items-center">
                            <Key className="mr-2 h-4 w-4" />
                            <span>API Keys</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/settings/export" className="flex items-center">
                            <Download className="mr-2 h-4 w-4" />
                            <span>Export Settings</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/settings/analytics" className="flex items-center">
                            <BarChart3 className="mr-2 h-4 w-4" />
                            <span>Analytics</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/settings/branding" className="flex items-center">
                            <Palette className="mr-2 h-4 w-4" />
                            <span>Branding</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/settings/training" className="flex items-center">
                            <GraduationCap className="mr-2 h-4 w-4" />
                            <span>Training</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <SignOutButton>
                      <DropdownMenuItem className="text-red-600">
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Sign Out</span>
                      </DropdownMenuItem>
                    </SignOutButton>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/sign-in"
                  className="text-gray-700 hover:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 shadow-sm hover:shadow-md"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-b border-gray-200">
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/search"
              className="text-gray-600 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              Search
            </Link>
            <Link
              href="/pricing"
              className="text-gray-600 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            {mounted && isLoaded && isSignedIn && (
              <>
                <Link
                  href="/dashboard"
                  className="text-gray-600 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                {user?.publicMetadata?.subscriptionPlan === 'enterprise' && (
                  <>
                    <Link
                      href="/favorites"
                      className="text-gray-600 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Favorites
                    </Link>
                    <Link
                      href="/teams"
                      className="text-gray-600 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Teams
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
