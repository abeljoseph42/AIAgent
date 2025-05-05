'use client'  


import { createContext, useState } from "react";

interface NavigationContextType {
    isMobileNavOpen: boolean;
    setisMobileNavOpen: (open: boolean) => void;
    closeMobileNav: () => void;
}

export const NavigationContext = createContext<NavigationContextType | undefined>(
    undefined
);

export function NavigationProvider({
    children,
}: {
  children: React.ReactNode;
}) {
    const [isMobileNavOpen, setisMobileNavOpen] = useState(false);

    const closeMobileNav = () => setisMobileNavOpen(false);

    return (
    <NavigationContext //Once Dashboard Layout function is made this red underline should be resolved 
        value={{ isMobileNavOpen, setisMobileNavOpen, closeMobileNav }}
    >
        {children}
    </NavigationContext>
    );
}