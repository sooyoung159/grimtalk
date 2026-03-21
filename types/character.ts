export interface CharacterCard {
  name: string;
  identity: string;
  traits: [string, string];
  voiceTone: string;
  greeting: string;
  question: string;
  narration?: string;
}
