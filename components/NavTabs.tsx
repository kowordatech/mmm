"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Today" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/calendar", label: "Calendar" },
  { href: "/generate", label: "Generate" },
  { href: "/settings", label: "Settings" },
];

export default function NavTabs() {
  const pathname = usePathname();

  return (
    <nav>
      {TABS.map((tab) => {
        const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
        return (
          <Link key={tab.href} href={tab.href} className={active ? "active" : ""}>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
