import { Reveal } from "../../../motion/Reveal";
import { Section } from "./Section";

const STEPS: [string, string, string][] = [
  ["1", "Install the GitHub App", "Pick the repositories you want reviewed. It needs read access to code and write access to pull requests, nothing else."],
  ["2", "Open a pull request", "Reviewly reads the diff, checks every change and drops anything it cannot support from the code shown."],
  ["3", "Get one focused review", "A single review with inline comments and suggested fixes. Reply to accept or dismiss and it learns what your team wants."],
];

export function HowItWorks() {
  return (
    <Section id="how" title="How it works" lead="Three steps, and no configuration to start.">
      <ol className="steps-3">
        {STEPS.map(([n, title, body], i) => (
          <Reveal as="li" key={n} delay={i * 0.08} className="card step">
            <span className="step-n">{n}</span>
            <h3>{title}</h3>
            <p>{body}</p>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}
