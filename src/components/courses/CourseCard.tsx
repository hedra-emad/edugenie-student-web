"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Clock, Users, BookOpen, Heart } from "lucide-react";

import { Course, CourseLevel } from "@/types/course";
import { addCourseToCartSmart } from "@/app/actions/cart.actions";
import { getCart } from "@/lib/api/checkout";
import { fetchCoursePricing } from "@/lib/api/enrollments";
import { useSession } from "@/providers/SessionProvider";
import { useCartContext } from "@/contexts/CartContext";
import Toast from "@/components/ui/Toast";
import Button from "@/components/ui/Button";

// ─── Helpers

const LEVEL_STYLES: Record<CourseLevel, string> = {
  beginner: "bg-emerald-100 text-emerald-700",
  intermediate: "bg-amber-100   text-amber-700",
  advanced: "bg-red-100     text-red-700",
};

const LEVEL_LABELS: Record<CourseLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className={`text-[13px] leading-none select-none ${
            s <= Math.round(rating) ? "text-amber-400" : "text-gray-200"
          }`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

// ─── CourseCard ──

interface Props {
  course: Course;
}

function getSafeImageSrc(src: string | null | undefined): string | null {
  if (!src) return null;
  const trimmed = src.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/")) return trimmed;
  if (!/^https?:\/\//i.test(trimmed)) return null;
  try {
    const { hostname } = new URL(trimmed);
    if (hostname === "example.com") return null;
    if (
      hostname === "res.cloudinary.com" ||
      hostname === "edugenie-api.vercel.app" ||
      hostname === "images.unsplash.com"
    ) {
      return trimmed;
    }
    return null;
  } catch {
    return null;
  }
}

// ─── SVG helpers ─────────────────────────────────────────────────────────────

function CartIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

export default function CourseCard({ course }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useSession();
  const { setCartCount } = useCartContext();

  // Per-user pricing: if the student already bought some sections, the full
  // course now costs only the remaining balance. Guests get the catalog price.
  const { data: pricing } = useQuery({
    queryKey: ["course-pricing", course.id],
    queryFn: () => fetchCoursePricing(course.id),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  const ownsFull = pricing?.owned === "full";
  const ownsSomeSections =
    pricing?.owned === "section" && pricing.remainingPrice < pricing.fullPrice;
  const displayPrice = ownsSomeSections ? pricing!.remainingPrice : course.price;
  const [imgError, setImgError] = useState(false);
  const [wished, setWished] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    if (isPending) return;

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    startTransition(async () => {
      // Smart add: the backend adds only the sections the student doesn't own
      // (or the full course if they own nothing), so they pay only the rest.
      const result = await addCourseToCartSmart(course.id);

      if (result.success) {
        // Refresh the shared count from the server and invalidate the header's
        // cart query so the badge updates immediately.
        const cart = await getCart();
        if (cart) {
          setCartCount(cart.items.length);
        }
        await queryClient.invalidateQueries({ queryKey: ["cart"] });
        setShowToast(true);
      } else {
        setCartError(result.error ?? "Could not add to cart");
        setTimeout(() => setCartError(null), 3000);
      }
    });
  }

   const raw = course.instructor ?? course.instructorId;
  const instructorName = raw
    ? `${raw.firstName ?? ""} ${raw.lastName ?? ""}`.trim()
    : "—";

  const instructorInitials =
    [raw?.firstName?.[0] ?? "", raw?.lastName?.[0] ?? ""]
      .join("")
      .toUpperCase() || "IN";
  const categoryName =
    typeof course.categoryId === "object" && course.categoryId?.name
      ? course.categoryId.name
      : "Course";

  const safeThumbnail = getSafeImageSrc(course.thumbnail);
 
  return (
    <>
      {showToast && <Toast onDismiss={() => setShowToast(false)} />}
      <Link href={`/courses/${course.id}`} className="group block">
      <motion.article
        whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(59,24,146,0.15)" }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="
          rounded-xl shadow-md bg-white cursor-pointer
          overflow-hidden flex flex-col h-full
          border border-slate-200
        "
      >
        {/* ── Thumbnail — fixed 168px ── */}
        <div className="relative h-[168px] w-full flex-shrink-0 overflow-hidden bg-slate-100">
          {!imgError && safeThumbnail ? (
            <Image
              src={safeThumbnail}
              alt={course.title}
              fill
              sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw"
              className="object-cover object-center"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-violet-900 via-violet-600 to-blue-600" />
          )}

          {/* scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {/* level badge */}
          <span
            className={`
              absolute top-3 right-3 z-10
              text-[11px] font-bold px-2.5 py-1 rounded-full
              ${LEVEL_STYLES[course.level]}
            `}
          >
            {LEVEL_LABELS[course.level]}
          </span>

          {/* wishlist */}
          {/* <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setWished((p) => !p);
            }}
            aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
            className={`
              absolute top-3 left-3 z-10
              w-8 h-8 rounded-full flex items-center justify-center
              backdrop-blur-sm border transition-all duration-200
              ${
                wished
                  ? "bg-red-500/30 border-red-400/40 text-red-300"
                  : "bg-white/15 border-white/20 text-white hover:bg-white/28"
              }
            `}
          >
            <Heart size={14} fill={wished ? "currentColor" : "none"} />
          </button> */}

          {/* hover overlay */}
          <div
            className="
            absolute inset-0 z-20 flex items-center justify-center
            bg-black/50 backdrop-blur-[2px]
            opacity-0 group-hover:opacity-100 transition-opacity duration-300
          "
          >
            <span
              className="
              bg-white text-slate-900 text-xs font-bold px-5 py-2.5 rounded-full
              translate-y-2 group-hover:translate-y-0 transition-transform duration-300
              shadow-lg
            "
            >
              View Course
            </span>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-col px-4 pt-4 pb-0 overflow-hidden">
          {/* Category — h-6 */}
          <div className="h-6 flex items-center mb-2 flex-shrink-0">
            <span
              className="text-[11px] font-bold uppercase tracking-wider
                             text-[#3B1892] bg-violet-50 border border-violet-100
                             px-2.5 py-[3px] rounded-full whitespace-nowrap"
            >
              {categoryName}
            </span>
          </div>

          {/* Title — h-14 */}
          <div className="h-14 mb-3 flex-shrink-0 overflow-hidden">
            <h3
              className="text-sm leading-[1.4] text-slate-900 line-clamp-3"
              style={{ fontWeight: 700 }}
            >
              {course.title}
            </h3>
          </div>

          {/* Instructor — h-7 */}
          <div className="h-7 flex items-center gap-2 mb-2 flex-shrink-0 overflow-hidden">
            <div
              className="
              w-6 h-6 rounded-full flex items-center justify-center
              text-[9px] font-black text-white flex-shrink-0
              bg-gradient-to-br from-violet-600 to-blue-600
            "
            >
              {instructorInitials}
            </div>
            <span
              className="text-xs text-slate-500 truncate min-w-0"
              style={{ fontWeight: 500 }}
            >
              {instructorName}
            </span>
          </div>

          {/* Meta row — h-6 */}
          <div className="h-6 flex items-center gap-3 mb-3 flex-shrink-0">
            {course.totalLessons != null && (
              <div className="flex items-center gap-1 text-slate-400">
                <BookOpen size={12} />
                <span className="text-[11px]">
                  {course.totalLessons} lessons
                </span>
              </div>
            )}
            {course.totalHours != null && (
              <div className="flex items-center gap-1 text-slate-400">
                <Clock size={12} />
                <span className="text-[11px]">{course.totalHours}h</span>
              </div>
            )}
            {course.totalEnrollments != null && (
              <div className="flex items-center gap-1 text-slate-400">
                <Users size={12} />
                <span className="text-[11px]">
                  {course.totalEnrollments >= 1000
                    ? `${(course.totalEnrollments / 1000).toFixed(1)}K`
                    : course.totalEnrollments}
                </span>
              </div>
            )}
          </div>

          {/* Rating — h-[22px] */}
          <div className="h-[22px] flex items-center gap-1.5 flex-shrink-0">
            {course.ratingAverage != null ? (
              <>
                <Stars rating={course.ratingAverage} />
                <span className="text-xs font-bold text-amber-800 leading-none">
                  {course.ratingAverage.toFixed(1)}
                </span>
              </>
            ) : (
              <span className="text-xs text-slate-400">No ratings yet</span>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          className="
          flex flex-col
          px-4 mt-3 border-t border-slate-100 flex-shrink-0 pb-4
        "
        >
          <div className="flex items-center justify-between gap-2 pt-3">
            <div className="flex flex-col gap-0.5 min-w-0">
              {ownsFull ? (
                <span className="text-[13px] font-black text-emerald-600 leading-none">
                  Owned
                </span>
              ) : (
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-[17px] font-black text-slate-900 leading-none tracking-tight">
                    ${displayPrice.toFixed(2)}
                  </span>
                  {ownsSomeSections && (
                    <span className="text-[11px] font-semibold text-slate-400 line-through leading-none">
                      ${pricing!.fullPrice.toFixed(2)}
                    </span>
                  )}
                </div>
              )}
              {ownsSomeSections && (
                <span className="text-[10px] font-semibold text-emerald-600 leading-none">
                  You own {pricing!.ownedSectionCount}/{pricing!.totalSections} sections — pay the rest
                </span>
              )}
            </div>

            {ownsFull ? (
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  router.push(`/learn/${course.id}`);
                }}
                variant="secondary"
                className="flex-shrink-0"
              >
                <span className="whitespace-nowrap">Go to course</span>
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleAddToCart}
                loading={isPending}
                aria-label="Add to cart"
                leftIcon={<CartIcon />}
                className="flex-shrink-0"
              >
                <span className="whitespace-nowrap">Add to Cart</span>
              </Button>
            )}
          </div>

          {cartError && (
            <p className="text-red-500 text-xs mt-1.5" role="alert">
              {cartError}
            </p>
          )}
        </div>
      </motion.article>
    </Link>
    </>
  );
}
