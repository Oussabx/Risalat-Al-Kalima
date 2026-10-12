/**
 * Re-mounted on every navigation: each page enters with a quiet fade.
 * The fill mode is `backwards` (not the token's `both`) so no opacity layer —
 * and no stacking context — remains once the fade ends; fixed bars and dialogs
 * inside pages keep their normal stacking order.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-fade-in" style={{ animationFillMode: 'backwards' }}>
      {children}
    </div>
  );
}
