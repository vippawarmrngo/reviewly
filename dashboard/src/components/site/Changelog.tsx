import { CHANGELOG } from "../../content/changelog";
import { Reveal } from "../../motion/Reveal";

export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export default function Changelog() {
  return (
    <article className="prose site">
      <h1>Changelog</h1>
      <p className="site-lead">What changed in Reviewly, newest first.</p>
      <p className="notice">This log follows development. Reviewly has not been announced as a hosted service yet, so there are no version numbers.</p>
      <ol className="changelog">
        {CHANGELOG.map((entry) => (
          <Reveal as="li" key={entry.title} className="log-entry">
            <time dateTime={entry.date}>{formatDate(entry.date)}</time>
            <h2>{entry.title}</h2>
            <ul>
              {entry.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Reveal>
        ))}
      </ol>
    </article>
  );
}
