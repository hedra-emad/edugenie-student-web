import React from "react";
import Button, { type ButtonProps } from "@/components/ui/Button";

/**
 * Thin wrapper kept for the auth forms' API (full-width primary submit with a
 * loading state). Delegates to the shared <Button> so auth buttons match the
 * rest of the app. Prefer importing <Button> directly in new code.
 */
type AuthButtonProps = Omit<ButtonProps, "variant" | "fullWidth">;

export default function AuthButton({ type = "button", ...props }: AuthButtonProps) {
  return <Button variant="primary" fullWidth type={type} {...props} />;
}
