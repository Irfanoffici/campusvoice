export type Category = 
  | 'teaching' 
  | 'facilities' 
  | 'administration' 
  | 'safety' 
  | 'events' 
  | 'general';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface FeedbackData {
  category: Category;
  message: string;
  priority: Priority;
}

export const CATEGORIES: { id: Category; label: string; color: string }[] = [
  { id: 'teaching', label: 'Teaching & Learning', color: '#4facfe' },
  { id: 'facilities', label: 'Campus Facilities', color: '#43e97b' },
  { id: 'administration', label: 'Administration', color: '#a18cd1' },
  { id: 'safety', label: 'Safety', color: '#ff9a9e' },
  { id: 'events', label: 'Events', color: '#fbc2eb' },
  { id: 'general', label: 'General', color: '#8fd3f4' },
];

export const PRIORITIES: { id: Priority; label: string; color: string }[] = [
  { id: 'low', label: 'Low', color: '#a8edea' },
  { id: 'medium', label: 'Medium', color: '#fad0c4' },
  { id: 'high', label: 'High', color: '#ff9a9e' },
  { id: 'critical', label: 'Critical', color: '#f5576c' }, // Gradients will be handled in CSS
];
