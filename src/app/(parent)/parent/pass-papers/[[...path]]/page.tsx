import ParentPassPapersView from "../parent-pass-papers-view";

type PageProps = {
  params: Promise<{ path?: string[] }>;
};

export default async function ParentPassPapersPage({ params }: PageProps) {
  const { path: pathSlugs } = await params;
  return <ParentPassPapersView pathSlugs={pathSlugs ?? []} />;
}
