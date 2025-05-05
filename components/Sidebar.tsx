"use client";
import { NavigationContext } from "@/lib/NavigationProvider";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useContext } from "react";
import { Button } from "./ui/button";
import { PlusIcon } from "@radix-ui/react-icons";

function Sidebar() {
    const router = useRouter();
    const { closeMobileNav, isMobileNavOpen} = useContext(NavigationContext);
    console.log("Sidebar isMobileNavOpen:", isMobileNavOpen);
    function handleNewChat() {
        console.log("New Chat button clicked");
    }
    console.log("Sidebar component rendered, isMobileNavOpen:", isMobileNavOpen);

    return <>
        {isMobileNavOpen && (
            <div
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            onClick={closeMobileNav}
            />
        )}

        <div className="font-bold text-lg p-4 absolute top-0 left-0">Sidebar</div>
    </>;
}

export default Sidebar
