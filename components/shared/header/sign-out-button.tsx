"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { logout } from '@/lib/actions/auth.actions'

export default function SignOutButton() {
  const router = useRouter()

  const handleClick = async () => {
    try {
      await logout('/')
      // Server will redirect; ensure client state updates
      router.replace('/')
      router.refresh()
    } catch (error) {
      console.error('Sign out failed', error)
    }
  }

  return (
    <Button
      onClick={handleClick}
      variant='ghost'
      className='w-full py-4 px-2 h-4 justify-start'
    >
      Sign Out
    </Button>
  )
}
