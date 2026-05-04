# Chrome Web Store — Detailed description

Paste the text below into the "Detailed description" field on the Chrome
Web Store dashboard. Plain text, no Markdown. Sits well under the
16,000-character limit.

---

Find Preprint helps you read scientific papers that are hiding behind a
paywall. When you open a journal article in Chrome, the extension checks
whether the article is open access, and if it is not, finds a freely
available preprint version on bioRxiv, medRxiv, arXiv, ChemRxiv,
Research Square, or another preprint server. One click takes you to the
free copy.

WHY YOU MIGHT WANT THIS

Most published papers also exist as a preprint posted by the authors
before peer review. Preprints are usually open to anyone, but they live
on different sites and are not always linked from the journal page. If
your institution does not have a subscription, finding the preprint
manually means leaving the journal site, opening Google Scholar, hoping
the right link appears, and clicking through. Find Preprint does that
work in the background and tells you the answer the moment the page
loads.

HOW IT WORKS

When you visit a journal article, the extension reads the article's DOI
from the page. It then queries a small chain of public scholarly APIs in
order of confidence:

  1. Unpaywall, to determine whether the article is open access and to
     surface any preprint URLs the service already knows about.
  2. Crossref, for authoritative "is preprint of" relations registered
     by the publisher.
  3. The bioRxiv and medRxiv API, which can map a published DOI directly
     to its preprint.
  4. Europe PMC, including its preprint comment-correction relations,
     with a follow-up call that resolves Europe PMC internal preprint
     ids to the real DOI on the preprint server.
  5. Semantic Scholar, which often surfaces an arXiv id when other
     sources do not.
  6. As a last resort, a Crossref title search restricted to
     posted-content (preprints), accepted only when the title match is
     very close. These results are clearly labeled as "likely match" so
     you can decide for yourself.

Results are cached locally for 30 days, keyed by DOI, so the same paper
is never looked up twice. The lookup typically completes in well under a
second.

THREE OUTCOMES, AT A GLANCE

The toolbar badge tells you the outcome before you even click:

  - OA (green): the article is open access. No preprint needed, but the
    popup will still link to a free version when one is known.
  - PP (blue): the article is paywalled, and a preprint was found.
    Click for the link, or use the slim banner injected at the top of
    the article page for a single-click jump to the preprint.
  - Lock icon (red): the article is paywalled and no preprint was
    found. The popup explains which sources were checked.

The in-page banner is opt-out. It only appears on paywalled pages where
a preprint actually exists, never on open-access pages and never when
nothing useful was found. Dismissing the banner hides it on that domain
for thirty days. You can disable the banner entirely in the settings.

PRIVACY

Find Preprint is built to be quiet on the network. The only data that
leaves your browser is the article DOI (or, when no DOI is found, the
article title and first author). That data is sent only to the public
scholarly APIs listed above, and only on pages where a journal article
is detected. There is no analytics, no telemetry, no user identifier,
no advertising, no third-party tracking. Lookup results and your
settings are stored locally in the browser and synced through your
Chrome account if you have sync enabled. The full privacy policy is
linked from the listing.

OPEN SOURCE

The extension is open source under the MIT license. The complete source
code, including the API chain logic and the DOI extraction heuristics,
is available on GitHub at github.com/rustlab1/find-preprint-extension.
Bug reports, feature requests, and pull requests are welcome.

WHO IT IS FOR

  - Researchers reading outside their institution's subscription range.
  - Graduate students who do not have access to expensive journals.
  - Independent scientists, journalists, and policy analysts who need
    primary sources but cannot pay per article.
  - Anyone who has ever hit a paywall and wondered whether the same
    paper exists for free somewhere else. Usually it does.

WHAT IT IS NOT

  - Not a piracy tool. Find Preprint does not bypass paywalls or access
    copyrighted content without authorization. It only links to
    preprints that the authors themselves have made publicly available
    on legitimate preprint servers.
  - Not a citation manager, reference downloader, or annotation tool.
    The single purpose is to find the freely available preprint version
    of the article you are viewing.
  - Not a search engine for papers. The extension only acts on the page
    you are currently viewing.

QUICK START

After installing, open any journal article. The toolbar icon will pick
up the outcome within a second or two. Click the icon for the popup
with the preprint link, the source list, and copy buttons. On
paywalled pages where a preprint exists, the slim banner at the top of
the page is the fastest path to the free version.

The settings page lets you change the polite-pool email used for
Unpaywall and Crossref requests, toggle the in-page banner, clear the
30-day result cache, and reset the list of domains where you have
dismissed the banner.

If a paper that should have a preprint shows up as "no preprint
found", please file an issue on the GitHub repository with the DOI so
the heuristics can be improved.

THANKS

Find Preprint relies on public scholarly infrastructure built by the
Unpaywall team at OurResearch, Crossref, the bioRxiv and medRxiv
teams, Europe PMC, and Semantic Scholar. None of this would be
possible without their work.
