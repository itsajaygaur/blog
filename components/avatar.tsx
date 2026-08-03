import Image from "next/image";
import { cn } from "@/lib/utils";

export function Avatar({
  name,
  image,
  className,
}: {
  name: string;
  image?: string | null;
  className?: string;
}) {
  const classes = cn("relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-secondary text-sm font-semibold text-secondary-foreground", className);
  if (!image) return <span className={classes}>{name.slice(0, 1).toUpperCase()}</span>;
  return (
    <span className={classes}>
      <Image src={image} alt="" fill sizes="48px" className="object-cover" />
    </span>
  );
}
