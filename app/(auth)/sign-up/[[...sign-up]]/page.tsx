import { SignUp, ClerkLoaded, ClerkLoading } from '@clerk/nextjs'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'

export default function SignUpPage() {
  return (
    <div className="min-h-screen grid grid-col-1 items-center justify-center lg:grid-cols-2">
        <div className="flex flex-col items-center justify-center h-full">
            <div className="text-center">
                <h1>Sign Up</h1>
                <p>Welcome </p>
            </div>
            <div>
                <ClerkLoaded>
                    <SignUp />
                </ClerkLoaded>
                <ClerkLoading>
                    <Loader2 className='animate-spin'/>
                </ClerkLoading>
            </div>
        </div>
        <div className="bg-gradient-to-b from-cyan-500 to-blue-500 h-full items-center justify-center hidden lg:flex">
            <Image src="/logo.svg" alt="logo" width={200} height={200} />
        </div>
    </div>
  )
} 