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
        "prose-headings:font-semibold prose-headings:text-icvf-navy prose-headings:mt-12 prose-headings:mb-4",
        "prose-p:my-6 prose-p:leading-8",
        "prose-a:text-icvf-blue prose-a:no-underline hover:prose-a:underline",
        "prose-img:my-10 prose-img:mx-auto prose-img:block prose-img:h-auto prose-img:w-full prose-img:max-w-3xl prose-img:rounded-xl prose-img:border prose-img:border-icvf-border/60 prose-img:shadow-sm",
        "prose-blockquote:my-10 prose-blockquote:border-l-icvf-blue prose-blockquote:pl-5 prose-blockquote:text-icvf-navy/70",
        className
      )}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
