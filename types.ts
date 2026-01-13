
export interface FormattingSuggestion {
  category: 'Grammar' | 'Structure' | 'Citation' | 'Tone';
  original: string;
  suggestion: string;
  explanation: string;
}

export interface ThesisAnalysis {
  formattedText: string;
  suggestions: FormattingSuggestion[];
  score: number;
  overallFeedback: string;
  missingSections: string[];
}

export enum AnalysisMode {
  GENERAL = 'general',
  ABSTRACT = 'abstract',
  CHAPTER = 'chapter',
  BIBLIOGRAPHY = 'bibliography',
  PROOFREAD = 'proofread'
}
