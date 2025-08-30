"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import useOrigin from "@/hooks/use-origin";
import { useMutation } from "convex/react";
import { Check, Copy, Globe } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";

type Props = {
  data: Doc<"documents">;
};

const Publish = ({ data }: Props) => {
  const origin = useOrigin();
  const update = useMutation(api.documents.updateDocument);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const publishedUrl = `${origin}/preview/${data._id}`;

  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  const onPublish = useCallback(async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      await update({
        id: data._id,
        isPublished: true,
      });
      toast.success("Note published successfully!");
    } catch (error) {
      console.error("Publish error:", error);
      toast.error("Failed to publish note.");
    } finally {
      setIsSubmitting(false);
    }
  }, [data._id, update, isSubmitting]);

  const onUnpublish = useCallback(async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      await update({
        id: data._id,
        isPublished: false,
      });
      toast.success("Note unpublished successfully!");
    } catch (error) {
      console.error("Unpublish error:", error);
      toast.error("Failed to unpublish note.");
    } finally {
      setIsSubmitting(false);
    }
  }, [data._id, update, isSubmitting]);

  const onCopy = useCallback(async () => {
    if (!isMounted) return;

    try {
      // Modern clipboard API (preferred)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(publishedUrl);
        if (isMounted) {
          setCopied(true);
          toast.success("Link copied to clipboard!");
        }
        return;
      }

      // Fallback using execCommand (deprecated but still works)
      const textArea = document.createElement("textarea");
      textArea.value = publishedUrl;

      // Make it invisible and non-interactive
      Object.assign(textArea.style, {
        position: "absolute",
        left: "-9999px",
        top: "-9999px",
        opacity: "0",
        pointerEvents: "none",
        zIndex: "-1",
      });

      textArea.setAttribute("readonly", "");
      textArea.setAttribute("tabindex", "-1");

      // Use a try-finally to ensure cleanup
      try {
        document.body.appendChild(textArea);
        textArea.select();
        textArea.setSelectionRange(0, 99999); // For mobile devices

        const successful = document.execCommand("copy");
        if (successful && isMounted) {
          setCopied(true);
          toast.success("Link copied to clipboard!");
        } else {
          throw new Error("Copy command failed");
        }
      } finally {
        // Always try to remove the element
        try {
          if (textArea.parentNode) {
            textArea.parentNode.removeChild(textArea);
          }
        } catch (removeError) {
          // If removal fails, just log it and continue
          console.warn("Failed to remove textarea:", removeError);
        }
      }
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      if (isMounted) {
        toast.error("Failed to copy link. Please copy manually.");
      }
    }
  }, [publishedUrl, isMounted]);

  // Cleanup copied state
  useEffect(() => {
    if (copied && isMounted) {
      const timer = setTimeout(() => {
        if (isMounted) {
          setCopied(false);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [copied, isMounted]);
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="ghost">
          Publish
          {data.isPublished && (
            <Globe className="text-green-500 w-4 h-4 ml-2" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72"
        align="end"
        alignOffset={8}
        onOpenAutoFocus={(e) => e.preventDefault()}>
        {data.isPublished ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-x-2">
              <Globe className="text-green-500 animate-pulse h-4 w-4" />
              <p className="text-xs font-medium text-green-500">
                This note is live on web.
              </p>
            </div>
            <div className="flex items-center">
              <input
                className="flex-1 px-2 text-xs border rounded-l-md h-8 bg-muted truncate"
                value={publishedUrl}
                disabled
              />
              <Button
                onClick={onCopy}
                disabled={copied}
                className="h-8 rounded-l-none">
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Button
              size="sm"
              className="w-full text-xs"
              disabled={isSubmitting}
              onClick={onUnpublish}>
              Unpublish
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <Globe className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium mb-2">Publish this note</p>
            <span className="text-xs text-muted-foreground mb-4">
              Share your work with others.
            </span>
            <Button
              disabled={isSubmitting}
              onClick={onPublish}
              className="w-full text-xs"
              size="sm">
              Publish
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default Publish;
