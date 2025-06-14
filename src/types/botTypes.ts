export interface MenuOption {
  title: string;
  response: string;
  endpoints: Record<string, string>;
  relatedTopics: string[];
}

export interface QuickResponse {
  keywords: string[];
  responses: string[];
}

export interface Keyword {
  matches: string[];
  response: string;
}

export interface CommonQuestion {
  response: string;
  relatedTopics: string[];
}

export interface BotKnowledge {
  menuOptions: Record<string, MenuOption>;
  quickResponses: {
    greetings: QuickResponse;
    farewell: QuickResponse;
  };
  commonQuestions: Record<string, CommonQuestion>;
  keywords: Record<string, Keyword>;
}
