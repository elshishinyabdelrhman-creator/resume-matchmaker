export type AtsBreakdown = {
  keywordCoverage: number;
  sectionPresence: number;
  lengthFit: number;
  formatHints: number;
  /** Coverage of “important” JD terms (longer tokens + bigrams). */
  keyTermCoverage: number;
};

export type AtsSimulationResult = {
  overall: number;
  breakdown: AtsBreakdown;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
  improvementTips: string[];
};

const STOP = new Set([
  "and",
  "the",
  "for",
  "with",
  "your",
  "our",
  "from",
  "this",
  "that",
  "will",
  "have",
  "are",
  "you",
  "any",
  "all",
  "not",
  "but",
  "can",
  "may",
  "who",
  "what",
  "when",
  "where",
  "why",
  "how",
  "into",
  "onto",
  "than",
  "then",
  "them",
  "they",
  "their",
  "work",
  "team",
  "role",
  "job",
  "open",
  "seeking",
  "looking",
  "opportunity",
  "position",
  "company",
  "including",
  "such",
  "other",
  "each",
  "every",
  "some",
  "also",
  "well",
  "must",
  "should",
  "could",
  "would",
  "about",
  "make",
  "using",
  "used",
  "based",
  "across",
  "within",
  "while",
  "through",
  "during",
  "among",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 2 && !STOP.has(t));
}

function extractKeyTerms(jobDescription: string): string[] {
  const lower = jobDescription.toLowerCase();
  const normalized = lower.replace(/[^a-z0-9+#\s]/g, " ");
  const tokens = normalized
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const terms = new Set<string>();

  for (const t of tokens) {
    if (t.length >= 4 && !STOP.has(t)) {
      terms.add(t);
    }
    if (/\d/.test(t) && t.length >= 2) {
      terms.add(t);
    }
  }

  for (let i = 0; i < tokens.length - 1; i++) {
    const a = tokens[i];
    const b = tokens[i + 1];
    if (!a || !b) continue;
    if (a.length >= 3 && b.length >= 3 && !STOP.has(a) && !STOP.has(b)) {
      terms.add(`${a} ${b}`);
    }
  }

  return [...terms];
}

function resumeMatchesTerm(resumeLower: string, term: string): boolean {
  if (term.includes(" ")) {
    return resumeLower.includes(term);
  }
  const re = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
  return re.test(resumeLower);
}

function buildSuggestions(params: {
  missing: string[];
  hasSummary: boolean;
  hasExperience: boolean;
  hasEducation: boolean;
  wordCount: number;
  formatHintsScore: number;
}): string[] {
  const out: string[] = [];

  for (const kw of params.missing.slice(0, 14)) {
    out.push(
      `Mirror “${kw}” in a skills or impact bullet—only if it reflects work you actually did.`,
    );
  }

  if (!params.hasExperience) {
    out.push("Add a clearly labeled Experience section with role, company, and metric-backed bullets.");
  }
  if (!params.hasSummary && params.wordCount > 120) {
    out.push("Add a 2–3 line summary that echoes the top themes from the job description.");
  }
  if (!params.hasEducation) {
    out.push("If the posting emphasizes degrees or certifications, add a compact Education section.");
  }
  if (params.wordCount < 280) {
    out.push("Expand 2–3 bullets with scope + outcome (users affected, % improvement, revenue, time saved).");
  }
  if (params.wordCount > 950) {
    out.push("Tighten wording: ATS parsers favor concise sections—trim filler adjectives.");
  }
  if (params.formatHintsScore < 75) {
    out.push("Use consistent bullets (• or -) and left-aligned sections to improve machine readability.");
  }

  return [...new Set(out)].slice(0, 18);
}

function buildImprovementTips(params: {
  breakdown: AtsBreakdown;
  missing: string[];
  matchedRatio: number;
  wordCount: number;
}): string[] {
  const tips: string[] = [];

  if (params.breakdown.keyTermCoverage < 55) {
    tips.push("Prioritize the top missing keywords that appear multiple times in the job description.");
  }
  if (params.breakdown.sectionPresence < 70) {
    tips.push("ATS templates parse faster when standard headings (Summary, Experience, Skills, Education) are present.");
  }
  if (params.breakdown.lengthFit < 60) {
    tips.push("Aim for ~350–750 words unless you are very senior—density beats length.");
  }
  if (params.matchedRatio > 0.75) {
    tips.push("Great keyword overlap—now tighten stories so humans see the same narrative the parser does.");
  }
  if (params.wordCount > 0 && params.wordCount < 200) {
    tips.push("Very short resumes often under-rank; add context on tools, stakeholders, and scale.");
  }

  tips.push("Export to plain text occasionally to catch hidden characters that confuse parsers.");

  return [...new Set(tips)].slice(0, 10);
}

/**
 * Heuristic ATS-style simulation: keyword coverage, structure, length, and formatting.
 */
export function simulateAtsMatch(resumeText: string, jobDescription: string): AtsSimulationResult {
  const resumeLower = resumeText.toLowerCase();
  const jd = jobDescription.trim();

  const rTokens = new Set(tokenize(resumeText));
  const jdTokens = tokenize(jd);
  const jdUnique = [...new Set(jdTokens)];

  const broadMatched = jdUnique.filter((t) => rTokens.has(t)).length;
  const broadCoverage =
    jdUnique.length === 0 ? 100 : Math.round((broadMatched / jdUnique.length) * 100);

  const keyTerms = extractKeyTerms(jd);
  const matchedKeyTerms = keyTerms.filter((term) => resumeMatchesTerm(resumeLower, term));
  const missingKeyTerms = keyTerms.filter((term) => !resumeMatchesTerm(resumeLower, term));

  const keyTermCoverage =
    keyTerms.length === 0
      ? broadCoverage
      : Math.round((matchedKeyTerms.length / keyTerms.length) * 100);

  const hasSummary = /summary|profile|objective|about/i.test(resumeText);
  const hasExperience = /experience|employment|work history|professional background/i.test(
    resumeText,
  );
  const hasEducation = /education|academic|university|college|degree/i.test(resumeText);
  const sectionHits = [hasSummary, hasExperience, hasEducation].filter(Boolean).length;
  const sectionPresence = Math.round((sectionHits / 3) * 100);

  const wordCount = resumeText.split(/\s+/).filter(Boolean).length;
  let lengthFit = 72;
  if (wordCount < 250) lengthFit = 48;
  if (wordCount > 900) lengthFit = 58;

  const formatHints = /[•\-\u2022]|^\s*[\-*]\s/m.test(resumeText) ? 88 : 64;

  const blendedKeyword = Math.round(broadCoverage * 0.35 + keyTermCoverage * 0.65);

  const breakdown: AtsBreakdown = {
    keywordCoverage: blendedKeyword,
    sectionPresence,
    lengthFit,
    formatHints,
    keyTermCoverage,
  };

  const overall = Math.round(
    blendedKeyword * 0.48 + sectionPresence * 0.22 + lengthFit * 0.2 + formatHints * 0.1,
  );

  const missingSorted = [...missingKeyTerms].sort((a, b) => b.length - a.length);
  const missingKeywords = missingSorted.slice(0, 36);
  const matchedKeywords = [...matchedKeyTerms].sort((a, b) => b.length - a.length).slice(0, 36);

  const suggestions = buildSuggestions({
    missing: missingKeywords,
    hasSummary,
    hasExperience,
    hasEducation,
    wordCount,
    formatHintsScore: formatHints,
  });

  const improvementTips = buildImprovementTips({
    breakdown,
    missing: missingKeywords,
    matchedRatio: keyTerms.length === 0 ? 1 : matchedKeyTerms.length / keyTerms.length,
    wordCount,
  });

  return {
    overall: Math.min(100, Math.max(0, overall)),
    breakdown,
    matchedKeywords,
    missingKeywords,
    suggestions,
    improvementTips,
  };
}
