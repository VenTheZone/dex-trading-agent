import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger, } from "@/components/ui/collapsible";
import { DialogContent, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Dialog } from "@radix-ui/react-dialog";
import { ChevronDown } from "lucide-react";
import React, { useEffect, useState } from "react";
function ErrorDialog({ error, setError, }) {
    return (<Dialog defaultOpen={true} onOpenChange={() => {
            setError(null);
        }}>
      <DialogContent className="bg-red-700 text-white max-w-4xl">
        <DialogHeader>
          <DialogTitle>Runtime Error</DialogTitle>
        </DialogHeader>
        A runtime error occurred. Please check the console for more details.
        <div className="mt-4">
          <Collapsible>
            <CollapsibleTrigger>
              <div className="flex items-center font-bold cursor-pointer">
                See error details <ChevronDown />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="max-w-[460px]">
              <div className="mt-2 p-3 bg-neutral-800 rounded text-white text-sm overflow-x-auto max-h-60 max-w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <pre className="whitespace-pre">{error.stack}</pre>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
        <DialogFooter>
          <Button onClick={() => setError(null)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);
}
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(error, info) {
        console.error("Error caught by boundary:", error, info);
        this.setState({
            hasError: true,
            error: {
                error: error.message,
                stack: info.componentStack ?? error.stack ?? "",
            },
        });
    }
    render() {
        if (this.state.hasError) {
            return (<ErrorDialog error={{
                    error: "An error occurred",
                    stack: "",
                }} setError={() => { }}/>);
        }
        return this.props.children;
    }
}
export function InstrumentationProvider({ children, }) {
    const [error, setError] = useState(null);
    useEffect(() => {
        const handleError = async (event) => {
            try {
                console.error("Runtime error:", event);
                event.preventDefault();
                setError({
                    error: event.message,
                    stack: event.error?.stack || "",
                    filename: event.filename || "",
                    lineno: event.lineno,
                    colno: event.colno,
                });
            }
            catch (error) {
                console.error("Error in handleError:", error);
            }
        };
        const handleRejection = async (event) => {
            try {
                console.error("Unhandled rejection:", event);
                setError({
                    error: event.reason.message,
                    stack: event.reason.stack,
                });
            }
            catch (error) {
                console.error("Error in handleRejection:", error);
            }
        };
        window.addEventListener("error", handleError);
        window.addEventListener("unhandledrejection", handleRejection);
        return () => {
            window.removeEventListener("error", handleError);
            window.removeEventListener("unhandledrejection", handleRejection);
        };
    }, []);
    return (<>
      <ErrorBoundary>{children}</ErrorBoundary>
      {error && <ErrorDialog error={error} setError={setError}/>}
    </>);
}
