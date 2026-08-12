// Thin wrapper around the Tauri commands defined in src-tauri/src/commands.rs.
import { invoke } from '@tauri-apps/api/core';

export interface Prompt {
  id: string;
  title: string;
  raw_input: string;
  created_at: string;
}

export interface Compile {
  id: string;
  prompt_id: string;
  mode: string;
  compiled_json: string;
  created_at: string;
}

export function createPrompt(title: string, rawInput: string): Promise<Prompt> {
  return invoke('create_prompt', { title, rawInput });
}

export function listPrompts(): Promise<Prompt[]> {
  return invoke('list_prompts');
}

export function saveCompile(promptId: string, mode: string, compiledJson: string): Promise<Compile> {
  return invoke('save_compile', { promptId, mode, compiledJson });
}

export function listCompiles(promptId: string): Promise<Compile[]> {
  return invoke('list_compiles', { promptId });
}

export function getCompile(id: string): Promise<Compile | null> {
  return invoke('get_compile', { id });
}
