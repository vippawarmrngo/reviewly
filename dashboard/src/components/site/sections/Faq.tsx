import { Icon } from "../../Icon";
import { Link } from "../../Link";
import { EVAL_URL, SOURCE_URL } from "../links";
import { Accordion, type AccordionItem } from "./Accordion";
import { Section } from "./Section";

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;

export const FAQ_ITEMS: AccordionItem[] = [
  {
    q: "Does Reviewly store my code?",
    a: "It stores the results of a review (each comment, its file and line, and usage counts), not your repository. Optional repository context search is off by default; when it is on, indexed code is deleted after 30 days unused or as soon as you uninstall.",
  },
  {
    q: "Where does my code go?",
    a: (
      <>
        The diff of a pull request is sent to an AI model to be reviewed, after secrets are redacted. By default that is a model run by this Reviewly service. If you
        add your own API key, it goes only to the provider you chose. See the <Link className="inline-link" to="/privacy">data handling</Link> page for details.
      </>
    ),
  },
  {
    q: "Can it approve or block my pull requests?",
    a: "No. It only ever posts comments. It never approves, never requests changes and never merges, so it cannot get in the way of your review process.",
  },
  {
    q: "Which languages does it support?",
    a: "It reviews the diff, so any language you can read in a diff. The optional repository context search understands Python, JavaScript, TypeScript, Go and Java.",
  },
  {
    q: "How accurate is it?",
    a: (
      <>
        On a small internal benchmark of 58 labeled changes, about 84–86% of the comments it posted were valid and it found 95–98% of the seeded bugs. That set is small
        and the recall figure is probably optimistic, so treat these as a rough guide, not a promise. Method and limits are in the{" "}
        <a className="inline-link" href={EVAL_URL} {...ext}>
          source repository <Icon name="external-link" size={11} />
        </a>
        .
      </>
    ),
  },
  {
    q: "Can I choose the AI model?",
    a: "Yes. Add your own key for OpenAI, Anthropic, Google Gemini, Groq, Mistral or any OpenAI-compatible endpoint under Settings. Reviews with your own key do not count against the free allowance.",
  },
  {
    q: "Can I tell it what to ignore?",
    a: (
      <>
        Yes. Add a <code>.reviewly.yml</code> to your repository with paths to ignore, your own rules, a strictness level and a comment limit.
      </>
    ),
  },
  {
    q: "Is it open source?",
    a: (
      <>
        Yes, under the MIT license. You can read the code, or run your own copy:{" "}
        <a className="inline-link" href={SOURCE_URL} {...ext}>
          source repository <Icon name="external-link" size={11} />
        </a>
        .
      </>
    ),
  },
];

export function Faq() {
  return (
    <Section id="faq" title="Questions">
      <Accordion items={FAQ_ITEMS} />
    </Section>
  );
}
