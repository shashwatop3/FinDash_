import { SignIn, ClerkLoaded, ClerkLoading } from '@clerk/nextjs'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center lg:grid lg:grid-cols-2">
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-center">
          <h1>Sign In</h1>
          <p>Welcome back</p>
        </div>
        <div>
          <ClerkLoaded>
            <SignIn />
          </ClerkLoaded>
          <ClerkLoading>
            <Loader2 className='animate-spin' />
          </ClerkLoading>
        </div>
      </div>
      <div className="bg-gradient-to-b from-cyan-500 to-blue-500 h-full items-center justify-center hidden sm:flex">
        <Image src="/logo.svg" alt="logo" width={200} height={200} />
      </div>
    </div>
  )
}