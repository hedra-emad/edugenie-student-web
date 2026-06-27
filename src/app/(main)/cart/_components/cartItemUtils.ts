import type { CartItem } from "@/types/checkout";

/** API delete id: sectionId for sections, courseId for full courses. */
export function getCartItemRemoveId(item: CartItem): string {
  if (item.type === "section") {
    return item.sectionId ?? item._id;
  }
  return item.courseId;
}

export function groupCartItemsByCourse(items: CartItem[]): Map<string, CartItem[]> {
  const grouped = new Map<string, CartItem[]>();
  for (const item of items) {
    const existing = grouped.get(item.courseId);
    if (existing) {
      existing.push(item);
    } else {
      grouped.set(item.courseId, [item]);
    }
  }
  return grouped;
}

export function getOrderedCourseIds(items: CartItem[]): string[] {
  return Array.from(new Map(items.map((item) => [item.courseId, true])).keys());
}
