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
  const currentContentRef = useRef<string>("");
  const editorCreated = useRef(false);

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
    if (!BlockNoteComponents || !isMounted || editorCreated.current) return;

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
            const newContent = JSON.stringify(
              newEditor.topLevelBlocks,
              null,
              2
            );
            if (newContent !== currentContentRef.current) {
              currentContentRef.current = newContent;
              onChangeRef.current(newContent);
            }
          } catch (error) {
            console.error("Failed to stringify editor content:", error);
          }
        }, 500); // Increased debounce for drag operations
      });

      setEditor(newEditor);
      editorCreated.current = true;
    } catch (error) {
      console.error("Failed to create editor:", error);
    }

    return () => {
      if (editor && editorCreated.current) {
        try {
          editor.destroy?.();
          editorCreated.current = false;
        } catch (error) {
          console.warn("Error destroying editor:", error);
        }
      }
    };
  }, [BlockNoteComponents, isMounted]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle content updates from props without recreating editor
  useEffect(() => {
    if (!editor || !content || isUpdatingContent.current) return;

    try {
      const newContent = JSON.parse(content);
      const currentBlocks = editor.topLevelBlocks;

      // Only update if content is significantly different (not just formatting)
      const currentContentString = JSON.stringify(currentBlocks);
      if (
        currentContentString !== content &&
        content !== currentContentRef.current
      ) {
        isUpdatingContent.current = true;

        // Store current selection/cursor position
        const selection = editor.getSelection();

        // Update content
        editor.replaceBlocks(currentBlocks, newContent);

        // Restore selection if possible
        setTimeout(() => {
          try {
            if (selection) {
              editor.setSelection(selection);
            }
          } catch (error) {
            // Selection restoration failed, that's okay
          }
          isUpdatingContent.current = false;
        }, 100);
      }
    } catch (error) {
      console.warn("Failed to update editor content:", error);
      isUpdatingContent.current = false;
    }
  }, [editor, content]);

  // Update editable state without recreating editor
  useEffect(() => {
    if (!editor) return;

    try {
      editor.isEditable = editable ?? true;
    } catch (error) {
      console.warn("Failed to update editor editable state:", error);
    }
  }, [editor, editable]);

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
