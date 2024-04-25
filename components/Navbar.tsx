import ThemeToggler from "@/components/ThemeToggler";
import { Button } from "@/components/ui/button";
import { auth, signIn, signOut } from "@/auth";
import Link from "next/link";
import { SquarePen } from 'lucide-react';


export default async function Navbar(){

    const session = await auth()

    return(
        <nav className="flex justify-between items-center py-3 px-6 border-b" >
            <Link href="/" >
              <h1 className="text-xl font-semibold" >blog</h1>
            </Link>

            <div className="flex gap-5 items-center" >


            
      {
        session?.user ?
        <>
        <Link href={`/new-story`} >
          <Button variant="ghost" ><SquarePen className="mr-2" size={18} /> Write</Button>
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

          <Button type="submit" >
            <Link href="/login" >
                Login
            </Link>
        </Button>


      }
        <ThemeToggler />

            </div>

        </nav>
    )
}