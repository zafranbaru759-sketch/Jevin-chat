export type PersonaType = "santai" | "kalem" | "humor" | "kritis";

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: number;
}
