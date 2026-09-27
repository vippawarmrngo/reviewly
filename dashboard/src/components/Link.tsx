import type { AnchorHTMLAttributes, MouseEvent } from "react";
import { navigate } from "../route";

interface Props extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  to: string;
}

/** An ordinary link that navigates without a page load. Modified clicks (new tab, etc.) behave as usual. */
export function Link({ to, onClick, target, ...rest }: Props) {
  function handle(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || target === "_blank") return;
    e.preventDefault();
    navigate(to);
  }
  return <a href={to} onClick={handle} target={target} {...rest} />;
}
