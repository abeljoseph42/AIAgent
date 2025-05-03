import { Button } from "./ui/button";
// Red underlined because the button.tsk does not exist yet
import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { UserButton } from "@clerk/nextjs";
// This fixes the error on the User button red underline on line 25 but he doesnt not say to do
// it in the video so we can remove it later if needed
function Header(){
    return (
        <header className="border-a border-gray-20050 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
            <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size = "icon"
                    // onClick={() => setIsMoblieNavOpen(true)}
                    className="md:hidden text-gray-500 hover:text-gray-700 hover:bg-gray-100/50"
                  >
                    <HamburgerMenuIcon className="h-5 w-5" />
                  </Button>
                  <div className ="font-semibold bg-gradient-to-r from-grey-800 to-gray-600 bg-clip-text
                   text-transparant">
                    Chat with an AI Agent
                   </div>
                </div>
                <div className="flex items-center">
                <UserButton
                    appearance={{
                        elements: {
                            avatarBox:
                              "h-8 w-8 ring-2 ring-grey-200/50 ring-offset-2 rounded-full transition-shadow hover:ring-grey-300/50",
                        },
                      }}
                    />
                </div>
            </div>
        </header>
    )
}

export default Header;