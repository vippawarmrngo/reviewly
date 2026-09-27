import { type ReactNode, useId, useState } from "react";
import { Icon } from "../../Icon";

export interface AccordionItem {
  q: string;
  a: ReactNode;
}

/** Questions that open and close. Each header is a real button (keyboard and screen-reader friendly);
 *  the panel animates with CSS, and closed panels are removed from the tab order. */
export function Accordion({ items }: { items: AccordionItem[] }) {
  const base = useId();
  const [open, setOpen] = useState<ReadonlySet<number>>(new Set());
  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  return (
    <div className="faq">
      {items.map((item, i) => {
        const isOpen = open.has(i);
        return (
          <div key={item.q} className="acc card" data-open={isOpen}>
            <h3>
              <button id={`${base}-b${i}`} type="button" aria-expanded={isOpen} aria-controls={`${base}-p${i}`} onClick={() => toggle(i)}>
                <span>{item.q}</span>
                <Icon name="chevron-down" size={16} />
              </button>
            </h3>
            <div id={`${base}-p${i}`} role="region" aria-labelledby={`${base}-b${i}`} className="acc-panel">
              <div className="acc-inner">
                <p>{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
