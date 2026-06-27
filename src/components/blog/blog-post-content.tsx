import { sanitizeBlogHtml } from "@/lib/blog/sanitize-html";
import { cn } from "@/lib/utils";

interface BlogPostContentProps {
  html: string;
  className?: string;
}

export function BlogPostContent({ html, className }: BlogPostContentProps) {
  const safeHtml = sanitizeBlogHtml(html);

  if (!safeHtml.trim()) {
    return null;
  }

  return (
    <div
      className={cn(
        "blog-post-content prose prose-lg max-w-none text-icvf-navy/90",
        "prose-headings:font-semibold prose-headings:text-icvf-navy",
        "prose-a:text-icvf-blue prose-a:no-underline hover:prose-a:underline",
        "prose-img:rounded-xl prose-img:shadow-sm",
        "prose-blockquote:border-l-icvf-blue prose-blockquote:text-icvf-navy/70",
        className
      )}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
