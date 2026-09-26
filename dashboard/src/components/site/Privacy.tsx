const SOURCE = "https://github.com/vippawar1104/meeting-summarizer";

/** What the software does with data. It describes behaviour, it is not a legal policy. */
export function Privacy() {
  return (
    <article className="prose site">
      <h1>Data handling</h1>
      <p className="site-lead">What Reviewly does with your code and account, in plain language.</p>
      <p className="notice">
        This page describes how the software behaves. It is not a legal policy: whoever runs this service is responsible for their own terms of
        service and privacy policy.
      </p>

      <h2>What we receive from GitHub</h2>
      <p>
        Webhook events for the repositories where the App is installed (pull request opened, updated, reopened; review-comment replies; pushes).
        The App requests read access to repository contents and metadata, and write access to pull requests.
      </p>

      <h2>What is sent to an AI model</h2>
      <p>
        The diff of the pull request, its title, and any rules from your <code>.reviewly.yml</code>. Before anything is sent, secrets found in
        the diff (API keys, tokens, private keys, passwords, credentials in URLs) are masked. The masking is pattern-based and can miss
        secrets in unusual formats.
      </p>
      <ul>
        <li>By default the model is one operated through this Reviewly service.</li>
        <li>If you add your own API key, your code is sent only to the provider you chose, and never to Reviewly's models.</li>
      </ul>

      <h2>What we store</h2>
      <ul>
        <li>Each comment we posted: file, line, severity, category, the comment text and any suggested replacement.</li>
        <li>A temporary cache of the model's answers for identical changes, keyed by a hash of the change (not the code itself), which expires automatically.</li>
        <li>Whether your team accepted or dismissed it, and whether its thread was resolved.</li>
        <li>Per-review usage: tokens, estimated cost, and which pull request and commit it was for.</li>
        <li>Your GitHub login and the installations you can access, while signed in (a signed cookie, valid for 12 hours).</li>
        <li>If you add your own model key: the key, encrypted; only its last four characters are ever shown again.</li>
      </ul>
      <p>We do not store the diff itself or a copy of your repository.</p>

      <h2>Optional repository context</h2>
      <p>
        An optional feature, off by default, can index your default branch so reviews understand surrounding code. When enabled, indexed code is
        redacted before it is stored, is deleted if not seen for 30 days, and is deleted immediately when you uninstall or remove a repository.
      </p>

      <h2>Your control</h2>
      <ul>
        <li>Uninstall the GitHub App at any time to stop all reviews.</li>
        <li>Remove your own API key in Settings; reviews then use the built-in models.</li>
        <li>Exclude paths from review with <code>ignore</code> in <code>.reviewly.yml</code>.</li>
      </ul>

      <h2>What we do not do</h2>
      <ul>
        <li>Reviewly does not train models on your code. What a model provider does with data it receives is governed by that provider's terms, so check them if you use your own key.</li>
        <li>It never approves, blocks or merges a pull request; it only posts comments.</li>
      </ul>

      <h2>Verify it yourself</h2>
      <p>
        Reviewly is open source under the MIT license, so every statement here can be checked in the{" "}
        <a className="inline-link" href={SOURCE} target="_blank" rel="noopener noreferrer">
          source code
        </a>
        .
      </p>
    </article>
  );
}
