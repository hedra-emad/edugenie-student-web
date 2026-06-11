export default function CourseDetailsPage({ params }: { params: { slug: string } }) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Course Details</h1>
      <p>Course Slug: {params.slug}</p>
    </div>
  );
}