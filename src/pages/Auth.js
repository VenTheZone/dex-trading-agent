import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, UserX } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useNavigate } from "react-router";
function Auth({ redirectAfterAuth } = {}) {
    const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            const redirect = redirectAfterAuth || "/";
            navigate(redirect);
        }
    }, [authLoading, isAuthenticated, navigate, redirectAfterAuth]);
    const handleGuestLogin = async () => {
        setIsLoading(true);
        setError(null);
        try {
            console.log("Local user access - no authentication required");
            await signIn();
            console.log("Access granted");
            const redirect = redirectAfterAuth || "/";
            navigate(redirect);
        }
        catch (error) {
            console.error("Navigation error:", error);
            console.error("Error details:", JSON.stringify(error, null, 2));
            setError(`Failed to navigate: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setIsLoading(false);
        }
    };
    return (<div className="min-h-screen flex flex-col">
      {/* Auth Content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center justify-center h-full flex-col">
          <Card className="min-w-[350px] pb-0 border shadow-md">
            <CardHeader className="text-center">
              <div className="flex justify-center">
                <img src="./logo.svg" alt="Lock Icon" width={64} height={64} className="rounded-lg mb-4 mt-4 cursor-pointer" onClick={() => navigate("/")}/>
              </div>
              <CardTitle className="text-xl">Get Started</CardTitle>
              <CardDescription>
                Continue as guest to access the trading platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button type="button" variant="default" className="w-full" onClick={handleGuestLogin} disabled={isLoading}>
                {isLoading ? (<>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                    Signing in...
                  </>) : (<>
                    <UserX className="mr-2 h-4 w-4"/>
                    Continue as Guest
                  </>)}
              </Button>
              {error && (<p className="mt-2 text-sm text-red-500 text-center">{error}</p>)}
            </CardContent>

            <div className="py-4 px-6 text-xs text-center text-muted-foreground bg-muted border-t rounded-b-lg">
              Secured by{" "}
              <a href="https://github.com/VenTheZone/dex-trading-agent/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary transition-colors">
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>);
}
export default function AuthPage(props) {
    return (<Suspense>
      <Auth {...props}/>
    </Suspense>);
}
