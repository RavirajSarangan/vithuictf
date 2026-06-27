"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { useCallback, useEffect, useRef } from "react";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link2,
  ImageIcon,
  Undo2,
  Redo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadAdminAsset } from "@/lib/actions/admin";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AdminRichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

function ToolbarButton({
  active,
  onClick,
  children,
  label,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      className={cn("size-8 shrink-0", active && "bg-muted text-foreground")}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

export function AdminRichTextEditor({
  value,
  onChange,
  placeholder = "Write your post content…",
  className,
}: AdminRichTextEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadingRef = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Image.configure({ HTMLAttributes: { class: "rounded-lg max-w-full h-auto" } }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base max-w-none min-h-[280px] px-4 py-3 focus:outline-none dark:prose-invert",
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [editor, value]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const uploadImage = useCallback(
    async (file: File) => {
      if (!editor || uploadingRef.current) return;
      uploadingRef.current = true;
      try {
        const formData = new FormData();
        formData.set("file", file);
        formData.set("folder", "blog/content");
        const url = await uploadAdminAsset(formData);
        editor.chain().focus().setImage({ src: url }).run();
        toast.success("Image inserted");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Image upload failed");
      } finally {
        uploadingRef.current = false;
      }
    },
    [editor]
  );

  if (!editor) return null;

  return (
    <div className={cn("overflow-hidden rounded-lg border bg-background", className)}>
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/30 p-1.5">
        <ToolbarButton
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Ordered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Blockquote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Link" active={editor.isActive("link")} onClick={setLink}>
          <Link2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Insert image"
          onClick={() => fileRef.current?.click()}
        >
          <ImageIcon className="size-4" />
        </ToolbarButton>
        <div className="mx-1 hidden h-6 w-px bg-border sm:block" />
        <ToolbarButton label="Undo" onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Redo" onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 className="size-4" />
        </ToolbarButton>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void uploadImage(file);
          e.target.value = "";
        }}
      />

      <EditorContent editor={editor} />
    </div>
  );
}
