"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Overview" },
  { href: "/energy", label: "Energy control" },
  { href: "/battery", label: "Battery lifecycle" },
  { href: "/routes", label: "Route economics" },
  { href: "/drivers", label: "Driver income" },
  { href: "/finance", label: "Financial projection" },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sidebar">
      <Link href="/" className="brand" aria-label="EVOLVE home">
        <Image className="brand-full" src="/logo.png" alt="EVOLVE — Rethink. Recharge. Rise" width={559} height={515} priority />
        <Image className="brand-mark" src="/logo-mark.png" alt="" width={427} height={277} priority />
        <span className="brand-name">EVOLVE</span>
      </Link>
      <p className="product">RES NEXUS</p>
      <nav className="nav" aria-label="Modules">
        {nav.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={active ? "nav-link active" : "nav-link"} aria-current={active ? "page" : undefined}>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <p className="sidebar-note">
        Demo data. Pilot results and targets come from the PT RES case; other figures are illustrative and can be edited.
      </p>
    </aside>
  );
}
