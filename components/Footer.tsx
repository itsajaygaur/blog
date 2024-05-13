import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { FaGithub } from "react-icons/fa";
import { FaLinkedin } from "react-icons/fa";
import { Button } from "@/components/ui/button";

export default function Footer() {
  return (
    <footer className=" border-t py-10 px-4 bg-gray-50 dark:bg-zinc-900">
      <p className="text-center mb-6">
        Made by {" "}
        <Link
          target="_blank"
          href="https://ajaygaur.in"
          className="hover:underline text-sky-500"
        >
          Ajay
        </Link>
      </p>

      <div className="flex gap-4 items-center justify-center">
        <Button variant="link">
          <FaGithub size={18} className="mr-2" />
          <Link target="_blank" href="https://github.com/itsajaygaur/blog">
            Github
          </Link>
        </Button>

        <Separator orientation="vertical" className="h-6 bg-gray-400" />

        <Button variant="link">
          <FaLinkedin size={18} className="mr-2" />
          <Link target="_blank" href="https://linkedin.com/in/itsajaygaur">
            LinkedIn
          </Link>
        </Button>
      </div>
    </footer>
  );
}
