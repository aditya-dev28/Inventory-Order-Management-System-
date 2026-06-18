import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Universal Back button.
 * Uses browser history (navigate(-1)) when possible.
 * Falls back to the provided `fallbackTo` route (default: "/") when
 * there is no previous page in history (direct landing or refresh).
 */
export default function BackButton({ fallbackTo = "/", label = "Back", className = "" }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallbackTo);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={className}
      data-testid="back-button"
    >
      <ArrowLeft className="mr-1 h-4 w-4" />
      {label}
    </Button>
  );
}
