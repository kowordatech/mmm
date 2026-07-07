export type Channel = "linkedin" | "facebook" | "whatsapp_status" | "whatsapp_broadcast" | string;

export interface Post {
  date: string;
  channel: Channel;
  format?: string;
  posting_time?: string;
  body: string;
  cta?: string;
  hashtags?: string[];
  graphic_brief?: string;
  hook?: string;
}

export interface Week {
  week_number: number;
  theme?: string;
  posts: Post[];
}

export interface CalendarDoc {
  month?: string;
  theme?: string;
  offer_needed_by?: string;
  weeks: Week[];
  qa_report?: unknown[];
}

export interface Config {
  whatsappNumber?: string;
  offer?: string;
  context?: string;
  extra?: string;
  model?: string;
  maxTokens?: number;
  hooksHistoryMonths?: number;
}

export interface StateResponse {
  config: Config;
  months: string[];
  hasApiKey: boolean;
  today: string;
}

export interface PostedMap {
  [key: string]: string;
}

export interface MonthlyResult {
  dms?: number;
  demos?: number;
  signups?: number;
  revenue?: number;
  notes?: string;
}

export interface ResultsMap {
  [month: string]: MonthlyResult;
}
