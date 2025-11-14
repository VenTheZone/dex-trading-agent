import { toast } from "sonner";
export const handleError = (error, config) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const logMessage = config.logPrefix
        ? `${config.logPrefix}: ${errorMessage}`
        : errorMessage;
    console.error(logMessage, error);
    toast.error(config.title, {
        description: config.description,
    });
};
export const ERROR_MESSAGES = {
    MODAL_OPEN: {
        title: "Failed to open trading modal",
        description: "Please try again or refresh the page.",
        logPrefix: "Error opening token modal",
    },
    NAVIGATION: {
        title: "Failed to navigate to dashboard",
        description: "Please refresh the page and try again.",
        logPrefix: "Navigation error",
    },
    PREVIEW_OPEN: {
        title: "Failed to open preview",
        description: "Please try again.",
        logPrefix: "Error showing preview",
    },
    MODAL_CLOSE: {
        title: "Failed to close modal",
        description: "Please refresh the page.",
        logPrefix: "Error closing modal",
    },
    IFRAME_LOAD: {
        title: "Failed to load Hyperliquid trading interface",
        description: "Please check your internet connection or try again later.",
        logPrefix: "Iframe loading error",
    },
    CHART_LOAD: {
        title: "Chart loading failed",
        description: "Unable to load TradingView chart. Please refresh the page.",
        logPrefix: "TradingView chart error",
    },
    CHART_SCRIPT: {
        title: "Chart script failed to load",
        description: "Please check your internet connection and try again.",
        logPrefix: "TradingView script error",
    },
};
