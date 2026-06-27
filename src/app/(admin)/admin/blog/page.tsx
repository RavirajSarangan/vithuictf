"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  addBlogCategory,
  addBlogPost,
  deleteBlogCategory,
  deleteBlogPost,
  updateBlogCategory,
  updateBlogPost,
} from "@/lib/actions/admin";
import {
  useAdminBlogCategories,
  useAdminBlogPosts,
} from "@/hooks/use-data";
import { AdminTable } from "@/components/admin/admin-table";
import { AdminImageUpload } from "@/components/admin/admin-image-upload";
import { AdminRichTextEditor } from "@/components/admin/admin-rich-text-editor";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ExternalLink, FileText, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { slugifyBlogTitle } from "@/lib/blog/slug";
import type { BlogCategory, BlogPost, BlogPostStatus } from "@/types";

const EMPTY_POST_FORM: {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  categoryId: string;
  tags: string;
  seoTitle: string;
  seoDescription: string;
  isFeatured: boolean;
  status: BlogPostStatus;
} = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImageUrl: "",
  categoryId: "",
  tags: "",
  seoTitle: "",
  seoDescription: "",
  isFeatured: false,
  status: "draft",
};

const EMPTY_CATEGORY_FORM = {
  name: "",
  slug: "",
  description: "",
  sortOrder: 0,
  isActive: true,
};

export default function AdminBlogPage() {
  const { data: posts, refresh: refreshPosts } = useAdminBlogPosts();
  const { data: categories, refresh: refreshCategories } = useAdminBlogCategories();

  const [postOpen, setPostOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null);
  const [postForm, setPostForm] = useState(EMPTY_POST_FORM);
  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);

  const openCreatePost = () => {
    setEditingPost(null);
    setPostForm(EMPTY_POST_FORM);
    setPostOpen(true);
  };

  const openEditPost = (post: BlogPost) => {
    setEditingPost(post);
    setPostForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      coverImageUrl: post.coverImageUrl,
      categoryId: post.categoryId ?? "",
      tags: post.tags.join(", "),
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
      isFeatured: post.isFeatured,
      status: post.status,
    });
    setPostOpen(true);
  };

  const openCreateCategory = () => {
    setEditingCategory(null);
    setCategoryForm(EMPTY_CATEGORY_FORM);
    setCategoryOpen(true);
  };

  const openEditCategory = (category: BlogCategory) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      description: category.description,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
    });
    setCategoryOpen(true);
  };

  const postPayload = (status: "draft" | "published") => ({
    title: postForm.title,
    slug: postForm.slug || slugifyBlogTitle(postForm.title),
    excerpt: postForm.excerpt,
    content: postForm.content,
    coverImageUrl: postForm.coverImageUrl,
    categoryId: postForm.categoryId || null,
    tags: postForm.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    seoTitle: postForm.seoTitle,
    seoDescription: postForm.seoDescription,
    isFeatured: postForm.isFeatured,
    status,
  });

  const savePost = async (status: "draft" | "published") => {
    setSubmitting(true);
    try {
      const payload = postPayload(status);
      if (editingPost) {
        await updateBlogPost(editingPost.id, payload);
        toast.success(status === "published" ? "Post published" : "Post updated");
      } else {
        await addBlogPost(payload);
        toast.success(status === "published" ? "Post published" : "Draft saved");
      }
      refreshPosts();
      setPostOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save post");
    } finally {
      setSubmitting(false);
    }
  };

  const saveCategory = async () => {
    setSubmitting(true);
    try {
      const payload = {
        name: categoryForm.name,
        slug: categoryForm.slug || slugifyBlogTitle(categoryForm.name),
        description: categoryForm.description,
        sortOrder: categoryForm.sortOrder,
        isActive: categoryForm.isActive,
      };

      if (editingCategory) {
        await updateBlogCategory(editingCategory.id, payload);
        toast.success("Category updated");
      } else {
        await addBlogCategory(payload);
        toast.success("Category created");
      }
      refreshCategories();
      setCategoryOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save category");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeletePost = async () => {
    if (!deletePostId) return;
    try {
      await deleteBlogPost(deletePostId);
      refreshPosts();
      toast.success("Post deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setDeletePostId(null);
    }
  };

  const confirmDeleteCategory = async () => {
    if (!deleteCategoryId) return;
    try {
      await deleteBlogCategory(deleteCategoryId);
      refreshCategories();
      refreshPosts();
      toast.success("Category deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setDeleteCategoryId(null);
    }
  };

  const postColumns = useMemo(
    () => [
      {
        key: "title" as const,
        label: "Title",
        render: (row: BlogPost) => (
          <div className="space-y-1">
            <p className="font-medium">{row.title}</p>
            <p className="text-xs text-muted-foreground">/{row.slug}</p>
          </div>
        ),
      },
      {
        key: "status" as const,
        label: "Status",
        render: (row: BlogPost) => (
          <Badge variant={row.status === "published" ? "default" : "secondary"}>
            {row.status}
          </Badge>
        ),
      },
      {
        key: "categoryName" as const,
        label: "Category",
        render: (row: BlogPost) => row.categoryName ?? "—",
      },
      {
        key: "publishedAt" as const,
        label: "Published",
        render: (row: BlogPost) =>
          row.publishedAt ? new Date(row.publishedAt).toLocaleDateString() : "—",
      },
    ],
    []
  );

  const categoryColumns = useMemo(
    () => [
      { key: "name" as const, label: "Name" },
      { key: "slug" as const, label: "Slug" },
      {
        key: "isActive" as const,
        label: "Active",
        render: (row: BlogCategory) => (row.isActive ? "Yes" : "No"),
      },
    ],
    []
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Blog"
        description="Create and manage blog posts, categories, and cover images"
      />

      <Tabs defaultValue="posts">
        <TabsList>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button onClick={openCreatePost}>
              <Plus className="mr-2 size-4" /> New Post
            </Button>
          </div>

          {posts.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No blog posts yet"
              description="Create your first post to publish on the public blog page."
              action={
                <Button onClick={openCreatePost}>
                  <Plus className="mr-2 size-4" /> Create Post
                </Button>
              }
            />
          ) : (
            <AdminTable
              columns={postColumns}
              data={posts}
              onView={openEditPost}
              onDelete={setDeletePostId}
            />
          )}
        </TabsContent>

        <TabsContent value="categories" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button onClick={openCreateCategory}>
              <Plus className="mr-2 size-4" /> New Category
            </Button>
          </div>

          {categories.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No categories yet"
              description="Add categories to organize blog posts."
              action={
                <Button onClick={openCreateCategory}>
                  <Plus className="mr-2 size-4" /> Create Category
                </Button>
              }
            />
          ) : (
            <AdminTable
              columns={categoryColumns}
              data={categories}
              onView={openEditCategory}
              onDelete={setDeleteCategoryId}
            />
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={postOpen} onOpenChange={setPostOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost ? "Edit Post" : "New Post"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="post-title">Title</Label>
                <Input
                  id="post-title"
                  value={postForm.title}
                  onChange={(e) => setPostForm((f) => ({ ...f, title: e.target.value }))}
                  onBlur={() => {
                    if (!postForm.slug.trim() && postForm.title.trim()) {
                      setPostForm((f) => ({ ...f, slug: slugifyBlogTitle(f.title) }));
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="post-slug">Slug</Label>
                <Input
                  id="post-slug"
                  value={postForm.slug}
                  onChange={(e) => setPostForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="my-post-slug"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="post-excerpt">Excerpt</Label>
              <Textarea
                id="post-excerpt"
                rows={2}
                value={postForm.excerpt}
                onChange={(e) => setPostForm((f) => ({ ...f, excerpt: e.target.value }))}
                placeholder="Short summary for listing cards"
              />
            </div>

            <AdminImageUpload
              label="Cover image"
              folder="blog"
              value={postForm.coverImageUrl}
              onChange={(url) => setPostForm((f) => ({ ...f, coverImageUrl: url }))}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={postForm.categoryId || "none"}
                  onValueChange={(value) =>
                    setPostForm((f) => ({
                      ...f,
                      categoryId: !value || value === "none" ? "" : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No category</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="post-tags">Tags</Label>
                <Input
                  id="post-tags"
                  value={postForm.tags}
                  onChange={(e) => setPostForm((f) => ({ ...f, tags: e.target.value }))}
                  placeholder="ict, exam tips, zoom"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Content</Label>
              <AdminRichTextEditor
                value={postForm.content}
                onChange={(html) => setPostForm((f) => ({ ...f, content: html }))}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="post-seo-title">SEO title</Label>
                <Input
                  id="post-seo-title"
                  value={postForm.seoTitle}
                  onChange={(e) => setPostForm((f) => ({ ...f, seoTitle: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="post-seo-description">SEO description</Label>
                <Input
                  id="post-seo-description"
                  value={postForm.seoDescription}
                  onChange={(e) => setPostForm((f) => ({ ...f, seoDescription: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  id="post-featured"
                  checked={postForm.isFeatured}
                  onCheckedChange={(checked) => setPostForm((f) => ({ ...f, isFeatured: checked }))}
                />
                <Label htmlFor="post-featured">Featured post</Label>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              {editingPost?.status === "published" && (
                <Link
                  href={`/blog/${editingPost.slug}`}
                  target="_blank"
                  className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                >
                  <ExternalLink className="mr-2 size-4" /> Preview
                </Link>
              )}
              <div className="ml-auto flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setPostOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button variant="secondary" onClick={() => savePost("draft")} disabled={submitting}>
                  {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                  Save Draft
                </Button>
                <Button onClick={() => savePost("published")} disabled={submitting}>
                  {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                  Publish
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={categoryOpen} onOpenChange={setCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "New Category"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Name</Label>
              <Input
                id="cat-name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm((f) => ({ ...f, name: e.target.value }))}
                onBlur={() => {
                  if (!categoryForm.slug.trim() && categoryForm.name.trim()) {
                    setCategoryForm((f) => ({ ...f, slug: slugifyBlogTitle(f.name) }));
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-slug">Slug</Label>
              <Input
                id="cat-slug"
                value={categoryForm.slug}
                onChange={(e) => setCategoryForm((f) => ({ ...f, slug: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-description">Description</Label>
              <Textarea
                id="cat-description"
                rows={3}
                value={categoryForm.description}
                onChange={(e) => setCategoryForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-sort">Sort order</Label>
              <Input
                id="cat-sort"
                type="number"
                value={categoryForm.sortOrder}
                onChange={(e) =>
                  setCategoryForm((f) => ({ ...f, sortOrder: Number(e.target.value) || 0 }))
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="cat-active"
                checked={categoryForm.isActive}
                onCheckedChange={(checked) => setCategoryForm((f) => ({ ...f, isActive: checked }))}
              />
              <Label htmlFor="cat-active">Active</Label>
            </div>

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button variant="outline" onClick={() => setCategoryOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={saveCategory} disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletePostId} onOpenChange={() => setDeletePostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete post?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the blog post from the public site.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePost}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteCategoryId} onOpenChange={() => setDeleteCategoryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              Posts in this category will remain but lose their category assignment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCategory}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
