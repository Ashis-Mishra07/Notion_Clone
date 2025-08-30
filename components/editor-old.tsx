"use client";

import { useEdgeStore } from "@/lib/edgestore";
import { useTheme } from "next-themes";
import { useEffect, useState, useRef } from "react";
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

  useEffect(() => {
    const initializeEditor = async () => {
      if (hasInitialized.current) return;

      try {
        const [{ BlockNoteEditor }, { BlockNoteView, useBlockNote }] =
          await Promise.all([
            import("@blocknote/core"),
            import("@blocknote/react"),
          ]);

        hasInitialized.current = true;
        setBlockNoteComponents({
          BlockNoteEditor,
          BlockNoteView,
          useBlockNote,
        });
        setIsMounted(true);
      } catch (error) {
        console.error("Failed to load BlockNote:", error);
      }
    };

    initializeEditor();
  }, []);

  useEffect(() => {
    if (!BlockNoteComponents || !isMounted) return;

    const { BlockNoteEditor, useBlockNote } = BlockNoteComponents;

    const handleUpload = async (file: File) => {
      try {
        const response = await edgestore.publicFiles.upload({
          file,
        });
        return response.url;
      } catch (error) {
        console.error("File upload failed:", error);
        throw error;
      }
    };

    const getInitialContent = () => {
      if (!content) return undefined;
      try {
        return JSON.parse(content);
      } catch (error) {
        console.warn("Failed to parse content:", error);
        return undefined;
      }
    };

    try {
      const newEditor = BlockNoteEditor.create({
        editable,
        initialContent: getInitialContent(),
        uploadFile: handleUpload,
      });

      newEditor.onEditorContentChange(() => {
        try {
          onChange(JSON.stringify(newEditor.topLevelBlocks, null, 2));
        } catch (error) {
          console.error("Failed to stringify editor content:", error);
        }
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
  }, [BlockNoteComponents, isMounted, content, editable, onChange, edgestore]);

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
