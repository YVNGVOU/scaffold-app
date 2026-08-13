// Thin wrapper around the Tauri commands defined in src-tauri/src/commands.rs.
import { invoke } from '@tauri-apps/api/core';

export interface Prompt {
  id: string;
  title: string;
  raw_input: string;
  created_at: string;
  is_favorite: boolean;
  project_id: string | null;
}

export interface Compile {
  id: string;
  prompt_id: string;
  mode: string;
  compiled_json: string;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface Template {
  id: string;
  title: string;
  category: string;
  body: string;
  is_favorite: boolean;
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

export function renamePrompt(id: string, newTitle: string): Promise<void> {
  return invoke('rename_prompt', { id, newTitle });
}

export function deletePrompt(id: string): Promise<void> {
  return invoke('delete_prompt', { id });
}

/** TASK-080: pin/favorite a prompt so frequently-reused ones surface above
 * the chronological list, distinct from STARTER_PROMPTS (fixed built-in
 * examples) and from just scrolling. */
export function setFavorite(id: string, isFavorite: boolean): Promise<void> {
  return invoke('set_favorite', { id, isFavorite });
}

export function getSetting(key: string): Promise<string | null> {
  return invoke('get_setting', { key });
}

export function setSetting(key: string, value: string): Promise<void> {
  return invoke('set_setting', { key, value });
}

export function setPromptProject(id: string, projectId: string | null): Promise<void> {
  return invoke('set_prompt_project', { id, projectId });
}

export function createProject(name: string, description: string): Promise<Project> {
  return invoke('create_project', { name, description });
}

export function listProjects(): Promise<Project[]> {
  return invoke('list_projects');
}

export function renameProject(id: string, name: string, description: string): Promise<void> {
  return invoke('rename_project', { id, name, description });
}

export function deleteProject(id: string): Promise<void> {
  return invoke('delete_project', { id });
}

export function createTemplate(title: string, category: string, body: string): Promise<Template> {
  return invoke('create_template', { title, category, body });
}

export function listTemplates(): Promise<Template[]> {
  return invoke('list_templates');
}

export function setTemplateFavorite(id: string, isFavorite: boolean): Promise<void> {
  return invoke('set_template_favorite', { id, isFavorite });
}

export function deleteTemplate(id: string): Promise<void> {
  return invoke('delete_template', { id });
}

export interface StorageInfo {
  db_size_bytes: number;
  prompt_count: number;
  compile_count: number;
  project_count: number;
  template_count: number;
}

export function getStorageInfo(): Promise<StorageInfo> {
  return invoke('get_storage_info');
}

export function clearLocalData(): Promise<void> {
  return invoke('clear_local_data');
}
