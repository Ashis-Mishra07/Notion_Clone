"use client";

import CoverImage from "@/components/cover-image";
import Toolbar from "@/components/toolbar";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import dynamic from "next/dynamic";
import { useMemo, useCallback, useRef } from "react";

interface Props {
  params: {
    documentId: Id<"documents">;
  };
}

const DocumentDetailsPage = ({ params }: Props) => {
  const document = useQuery(api.documents.getDocumentById, {
    id: params.documentId,
  });
  const update = useMutation(api.documents.updateDocument);
  const lastContentRef = useRef<string>("");

  const Editor = useMemo(
    () =>
      dynamic(() => import("@/components/editor"), {
        ssr: false,
        loading: () => (
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading editor...</div>
          </div>
        ),
      }),
    []
  );

  const handleChange = useCallback(
    (content: string) => {
      // Only update if content actually changed
      if (content !== lastContentRef.current && content !== document?.content) {
        lastContentRef.current = content;
        update({
          id: params.documentId,
          content,
        });
      }
    },
    [params.documentId, update, document?.content]
  );

  if (document === undefined) {
    return (
      <div>
        <CoverImage.Skeleton />
        <div className="md:max-w-3xl lg:max-w-4xl mx-auto mt-10">
          <div className="space-y-4 pl-8 pt-4">
            <Skeleton className="h-14 w-[50%]" />
            <Skeleton className="h-4 w-[80%]" />
            <Skeleton className="h-4 w-[40%]" />
            <Skeleton className="h-4 w-[60%]" />
          </div>
        </div>
      </div>
    );
  }

  if (document === null) {
    return <div>Not Found</div>;
  }

  return (
    <div className="pb-40">
      <CoverImage url={document.coverImage} />
      <div className="md:max-w-3xl lg:max-w-4xl mx-auto">
        <Toolbar data={document} />
        <Editor onChange={handleChange} content={document.content} />
      </div>
    </div>
  );
};

export default DocumentDetailsPage;
