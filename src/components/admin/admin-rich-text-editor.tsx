"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { useCallback, useEffect, useRef, useState } from "react";
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
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadBlogImage } from "@/lib/actions/admin";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { validateRasterImageFile } from "@/lib/images/validate-raster-image";
import type { Editor } from "@tiptap/react";

interface AdminRichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

function ToolbarButton({
  active,
  disabled,
  onClick,
  children,
  label,
}: {
  active?: boolean;
  disabled?: boolean;
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
      disabled={disabled}
      className={cn("size-8 shrink-0", active && "bg-muted text-foreground")}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

async function uploadAndInsertImage(editor: Editor, file: File) {
  await validateRasterImageFile(file);

  const formData = new FormData();
  formData.set("file", file);
  formData.set("folder", "blog/content");
  formData.set("variant", "content");

  const url = await uploadBlogImage(formData);
  const alt = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
  editor.chain().focus().setImage({ src: url, alt }).run();
}

export function AdminRichTextEditor({
  value,
  onChange,
  placeholder = "Write your post content…",
  className,
}: AdminRichTextEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadQueueRef = useRef<Promise<void>>(Promise.resolve());
  const queueImagesRef = useRef<(files: File[]) => void>(() => {});
  const [uploadingCount, setUploadingCount] = useState(0);

  const queueImageUploads = useCallback((files: File[]) => {
    uploadQueueRef.current = uploadQueueRef.current
      .then(async () => {
        const editor = editorRef.current;
        if (!editor || files.length === 0) return;

        setUploadingCount((count) => count + files.length);
        let successCount = 0;

        for (const file of files) {
          try {
            await uploadAndInsertImage(editor, file);
            successCount += 1;
          } catch (error) {
            toast.error(
              error instanceof Error
                ? `${file.name}: ${error.message}`
                : `${file.name}: upload failed`
            );
          } finally {
            setUploadingCount((count) => Math.max(0, count - 1));
          }
        }

        if (successCount > 0) {
          toast.success(successCount === 1 ? "Image inserted" : `${successCount} images inserted`);
        }
      })
      .catch(() => {
        setUploadingCount(0);
      });
  }, []);

  queueImagesRef.current = queueImageUploads;

  const editorRef = useRef<Editor | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        blockquote: {},
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Image.configure({
        HTMLAttributes: {
          class:
            "blog-inline-image mx-auto my-10 block h-auto w-full max-w-3xl rounded-xl border border-border/60 shadow-sm",
        },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "prose prose-base sm:prose-lg max-w-none min-h-[360px] px-4 py-4 focus:outline-none dark:prose-invert prose-headings:scroll-mt-24 prose-p:leading-relaxed prose-blockquote:my-8 prose-blockquote:border-l-4 prose-blockquote:pl-5 prose-li:my-1",
      },
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        const imageFiles: File[] = [];
        for (const item of items) {
          if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (file) imageFiles.push(file);
          }
        }

        if (imageFiles.length === 0) return false;
        event.preventDefault();
        queueImagesRef.current(imageFiles);
        return true;
      },
      handleDrop: (_view, event) => {
        const files = event.dataTransfer?.files;
        if (!files?.length) return false;

        const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));
        if (imageFiles.length === 0) return false;

        event.preventDefault();
        queueImagesRef.current(imageFiles);
        return true;
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

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

  if (!editor) return null;

  const uploading = uploadingCount > 0;

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
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImageIcon className="size-4" />}
        </ToolbarButton>
        <div className="mx-1 hidden h-6 w-px bg-border sm:block" />
        <ToolbarButton label="Undo" onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Redo" onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 className="size-4" />
        </ToolbarButton>
        {uploading ? (
          <span className="px-2 text-xs text-muted-foreground">Uploading {uploadingCount}…</span>
        ) : null}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = e.target.files ? Array.from(e.target.files) : [];
          if (files.length > 0) queueImageUploads(files);
          e.target.value = "";
        }}
      />

      <EditorContent editor={editor} />
    </div>
  );
}
