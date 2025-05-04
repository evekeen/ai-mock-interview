import { PracticeRun, Story, Upload, UploadType, User } from '../types';
import { supabase } from './supabase-client';

export const userApi = {
  async createUser(clerkId: string, personalityType?: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .insert([{ clerk_id: clerkId, personality_type: personalityType }])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },
  
  async getUserByClerkId(clerkId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select()
      .eq('clerk_id', clerkId)
      .single();
      
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },
  
  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }
};

export const uploadApi = {
  async createUpload(userId: string, type: UploadType, url: string, parsedJson?: Record<string, unknown>): Promise<Upload | null> {
    const { data, error } = await supabase
      .from('uploads')
      .insert([{ 
        user_id: userId, 
        type, 
        url,
        parsed_json: parsedJson
      }])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },
  
  async getUserUploads(userId: string, type?: UploadType): Promise<Upload[]> {
    let query = supabase
      .from('uploads')
      .select()
      .eq('user_id', userId);
      
    if (type) {
      query = query.eq('type', type);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
};

export const storyApi = {
  async createStory(userId: string, category: string, title: string, bulletPoints?: string[]): Promise<Story | null> {
    const { data, error } = await supabase
      .from('stories')
      .insert([{ 
        user_id: userId, 
        category,
        title,
        bullet_points: bulletPoints
      }])
      .select()
      .single();
      
    if (error) {
      console.error(`Failed to create story for user ${userId}, category ${category}:`, error);
      throw error;
    }
    console.log(`Successfully created story ${data.id} for user ${userId}, category ${category}`);
    return data;
  },
  
  async updateStory(storyId: string, updates: Partial<Story>): Promise<Story | null> {
    const { data, error } = await supabase
      .from('stories')
      .update(updates)
      .eq('id', storyId)
      .select()
      .single();
      
    if (error) {
      console.error(`Failed to update story ${storyId}:`, error);
      throw error;
    }
    console.log(`Successfully updated story ${storyId}`);
    return data;
  },
  
  async getUserStories(userId: string): Promise<Story[]> {
    const { data, error } = await supabase
      .from('stories')
      .select()
      .eq('user_id', userId);
      
    if (error) throw error;
    return data || [];
  },
  
  async getUserStoryByCategory(userId: string, category: string): Promise<Story | null> {
    const { data, error } = await supabase
      .from('stories')
      .select()
      .eq('user_id', userId)
      .eq('category', category)
      .single();
      
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },
  
  async deleteStory(storyId: string): Promise<void> {
    const { error } = await supabase
      .from('stories')
      .delete()
      .eq('id', storyId);
      
    if (error) {
      console.error(`Failed to delete story ${storyId}:`, error);
      throw error;
    }
    console.log(`Successfully deleted story ${storyId}`);
  }
};

export const practiceRunApi = {
  async createPracticeRun(userId: string, storyId: string, audioUrl?: string): Promise<PracticeRun | null> {
    const { data, error } = await supabase
      .from('practice_runs')
      .insert([{ 
        user_id: userId, 
        story_id: storyId,
        audio_url: audioUrl
      }])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },
  
  async updatePracticeRun(runId: string, updates: Partial<PracticeRun>): Promise<PracticeRun | null> {
    const { data, error } = await supabase
      .from('practice_runs')
      .update(updates)
      .eq('id', runId)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },
  
  async getUserPracticeRuns(userId: string): Promise<PracticeRun[]> {
    const { data, error } = await supabase
      .from('practice_runs')
      .select()
      .eq('user_id', userId);
      
    if (error) throw error;
    return data || [];
  }
}; 