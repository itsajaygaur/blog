import { signIn } from "@/auth"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
  import { FcGoogle } from "react-icons/fc";


export default function Login(){
    return(
        // <section className="flex justify-center items-center h-dvh bg-gradient-to-tl from-slate-100 via-sky-50 to-sky-300 backdrop-blur-md dark:from-black dark:to-gray-700" >
        <section className="flex justify-center items-center h-dvh -mt-16" >

        <Card className="max-w-sm w-full items-center rounded-3xl" >
            <CardHeader>
                <h1 className="text-4xl mb-10 font-semibold text-sky-400" >blog</h1>
                <CardTitle className="" > Login</CardTitle>
                <CardDescription>Login to your account</CardDescription>
            </CardHeader>

            <CardContent>

            <form 
            className="w-full"
                action={async () => {
                    "use server"
                    await signIn("google", {redirectTo: "/"})
                }}
                >
                    <Button className="w-full" type="submit" > 
                    <FcGoogle className="mr-2" size={22} />
                        Login with Google
                    </Button>
                </form>
            </CardContent>

</Card>
                </section>
    )
}