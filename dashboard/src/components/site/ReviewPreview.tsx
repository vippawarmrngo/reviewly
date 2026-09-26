import { Icon } from "../Icon";

/** A made-up review comment, so visitors see the product before installing it. Labeled as an example. */
export function ReviewPreview() {
  return (
    <figure className="preview card" aria-label="Example review comment">
      <div className="preview-bar">
        <span className="dots" aria-hidden="true">
          <i /> <i /> <i />
        </span>
        <span className="muted">orders/pricing.py</span>
        <span className="pill">Example</span>
      </div>
      <pre className="diff" aria-label="Changed code">
        <span className="ln">12</span>{"  def apply_discount(total, pct):\n"}
        <span className="ln">13</span>{"      if pct > 0:\n"}
        <span className="ln add">14</span><span className="add">{"+         return total * (1 - pct / 100)\n"}</span>
        <span className="ln add">15</span><span className="add">{"+     return total / pct\n"}</span>
      </pre>
      <div className="comment">
        <div className="comment-head">
          <span className="mark small">
            <Icon name="check" size={11} />
          </span>
          <strong>Reviewly</strong>
          <span className="status dead">
            <Icon name="alert" size={12} />
            High · bug
          </span>
        </div>
        <p>
          When <code>pct</code> is 0 this falls through to <code>total / pct</code>, which divides by zero. A zero
          discount should return <code>total</code> unchanged.
        </p>
        <pre className="suggest" aria-label="Suggested fix">{"-     return total / pct\n+     return total"}</pre>
      </div>
    </figure>
  );
}
