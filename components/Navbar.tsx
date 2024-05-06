import ThemeToggler from "@/components/ThemeToggler";
import { Button } from "@/components/ui/button";
import { auth, signIn, signOut } from "@/auth";
import Link from "next/link";
import { SquarePen } from 'lucide-react';


export default async function Navbar(){

    const session = await auth()

    return(
        // <nav className="flex justify-between items-center  px-6 border-b sticky top-0 z-10 backdrop-blur-md  h-16 -mt-16 mb-16" >
        <nav className="flex justify-between items-center  px-6 border-b h-16" >
            <Link href="/" >
              <h1 className="text-xl font-semibold" >blog</h1>
            </Link>

            <div className="flex gap-5 items-center" >


            
      {
        session?.user ?
        <>
        <Link href={`/new-story`} >
          <Button variant="ghost" ><SquarePen className="mr-2" size={18} /> Write your story</Button>
        </Link>
          <form
        action={async () => {
          "use server"
          await signOut()
        }}
        >
      <Button variant="destructive" type="submit" >Logout</Button>
      </form>
          </>
      :

            <Link href="/login" >
          <Button type="submit" variant="ghost" >
          <SquarePen className="mr-2" size={18} /> write your story
        </Button>
            </Link>


      }
        <ThemeToggler />

            </div>

        </nav>
    )
}