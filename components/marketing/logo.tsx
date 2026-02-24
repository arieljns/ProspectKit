import Link from "next/link";
import {
  LogoMark,
  type LogoMarkProps,
} from "@/components/shared/branding/LogoMark";

export const LogoSVG = (props: LogoMarkProps) => {
  return <LogoMark {...props} />;
};

export const Logo = () => {
  return (
    <Link href="/" className="flex items-center gap-2">
      <LogoSVG className="h-7 w-7" />
      <span className="text-xl font-semibold tracking-tight">ProspectKit</span>
    </Link>
  );
};
