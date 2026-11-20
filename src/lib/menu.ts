export type MenuKind = "seller" | "admin" | "account";

export type MenuItem = {
  id: string;
  href: string;
  label: string;
  kind: MenuKind;
  count?: number;
};

export type MenuCounts = {
  payments: number;
  leads: number;
  accounts: number;
};

export type MenuInput = {
  isAdmin: boolean;
  hasStore: boolean;
  acting: boolean;
  counts?: MenuCounts | null;
};

const SELLER: MenuItem[] = [
  { id: "live", href: "/app", label: "Live", kind: "seller" },
  { id: "inbox", href: "/app/inbox", label: "Bandeja", kind: "seller" },
  { id: "filters", href: "/app/filters", label: "Filtros", kind: "seller" },
  { id: "billing", href: "/app/billing", label: "Cobro y acceso", kind: "seller" },
];

type AdminArea = {
  id: string;
  href: string;
  label: string;
  countKey: keyof MenuCounts;
};

const ADMIN_AREAS: AdminArea[] = [
  { id: "admin.payments", href: "/app/admin/pagos", label: "Pagos pendientes", countKey: "payments" },
  { id: "admin.leads", href: "/app/admin/leads", label: "Leads", countKey: "leads" },
  { id: "admin.accounts", href: "/app/admin/cuentas", label: "Cuentas", countKey: "accounts" },
];

const PROFILE: MenuItem = { id: "profile", href: "/app/profile", label: "Perfil", kind: "account" };

const ADMIN_PERFIL_DEMO: MenuItem = {
  id: "admin.perfil",
  href: "/perfil",
  label: "Cuentas TikTok (demo)",
  kind: "admin",
};

export function menuItems({ isAdmin, hasStore, acting, counts }: MenuInput): MenuItem[] {
  const items: MenuItem[] = [];

  if (hasStore || acting) {
    items.push(...SELLER);
  }

  if (isAdmin && !acting) {
    for (const area of ADMIN_AREAS) {
      const count = counts ? counts[area.countKey] : undefined;
      items.push({
        id: area.id,
        href: area.href,
        label: area.label,
        kind: "admin",
        ...(count === undefined ? {} : { count }),
      });
    }
    items.push(ADMIN_PERFIL_DEMO);
  }

  items.push(PROFILE);

  return items;
}
