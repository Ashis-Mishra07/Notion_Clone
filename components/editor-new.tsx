"use client";

import { useEdgeStore } from "@/lib/edgestore";
import { useTheme } from "next-themes";
import { useEffect, useState, useRef, useCallback } from "react";
import "@blocknote/react/style.css";

type Props = {
  onChange: (value: string) => void;
  content?: string;
  editable?: boolean;
};

const Editor = ({ onChange, content, editable }: Props) => {
  const { resolvedTheme } = useTheme();
  const { edgestore } = useEdgeStore();
  const [isMounted, setIsMounted] = useState(false);
  const [BlockNoteComponents, setBlockNoteComponents] = useState<any>(null);
  const [editor, setEditor] = useState<any>(null);
  const hasInitialized = useRef(false);
  const onChangeRef = useRef(onChange);
  const isUpdatingContent = useRef(false);

  // Update the onChange ref when it changes
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const initializeEditor = async () => {
      if (hasInitialized.current) return;

      try {
        const [{ BlockNoteEditor }, { BlockNoteView }] = await Promise.all([
          import("@blocknote/core"),
          import("@blocknote/react"),
        ]);

        hasInitialized.current = true;
        setBlockNoteComponents({ BlockNoteEditor, BlockNoteView });
        setIsMounted(true);
      } catch (error) {
        console.error("Failed to load BlockNote:", error);
      }
    };

    initializeEditor();
  }, []);

  const handleUpload = useCallback(
    async (file: File) => {
      try {
        const response = await edgestore.publicFiles.upload({
          file,
        });
        return response.url;
      } catch (error) {
        console.error("File upload failed:", error);
        throw error;
      }
    },
    [edgestore]
  );

  const getInitialContent = useCallback(() => {
    if (!content) return undefined;
    try {
      return JSON.parse(content);
    } catch (error) {
      console.warn("Failed to parse content:", error);
      return undefined;
    }
  }, [content]);

  useEffect(() => {
    if (!BlockNoteComponents || !isMounted) return;

    const { BlockNoteEditor } = BlockNoteComponents;

    try {
      const newEditor = BlockNoteEditor.create({
        editable: editable ?? true,
        initialContent: getInitialContent(),
        uploadFile: handleUpload,
      });

      // Use a debounced onChange to prevent rapid updates
      let timeoutId: NodeJS.Timeout;
      newEditor.onEditorContentChange(() => {
        if (isUpdatingContent.current) return;

        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          try {
            const content = JSON.stringify(newEditor.topLevelBlocks, null, 2);
            onChangeRef.current(content);
          } catch (error) {
            console.error("Failed to stringify editor content:", error);
          }
        }, 300); // 300ms debounce
      });

      setEditor(newEditor);
    } catch (error) {
      console.error("Failed to create editor:", error);
    }

    return () => {
      if (editor) {
        try {
          editor.destroy?.();
        } catch (error) {
          console.warn("Error destroying editor:", error);
        }
      }
    };
  }, [
    BlockNoteComponents,
    isMounted,
    editable,
    getInitialContent,
    handleUpload,
  ]);

  if (!isMounted || !BlockNoteComponents || !editor) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-muted-foreground">Loading editor...</div>
      </div>
    );
  }

  const { BlockNoteView } = BlockNoteComponents;

  return (
    <div className="w-full">
      <BlockNoteView
        editor={editor}
        theme={resolvedTheme === "dark" ? "dark" : "light"}
      />
    </div>
  );
};

export default Editor;
