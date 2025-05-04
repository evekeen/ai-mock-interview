import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type UserState = {
  personalityType: string | null;
  experience: string | null;
  goals: string[];
  setPersonalityType: (type: string) => void;
  setExperience: (level: string) => void;
  setGoals: (goals: string[]) => void;
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      personalityType: null,
      experience: null,
      goals: [],
      setPersonalityType: (type) => set({ personalityType: type }),
      setExperience: (level) => set({ experience: level }),
      setGoals: (goals) => set({ goals }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => typeof window !== 'undefined' ? localStorage : null as any),
    }
  )
);

type StoryState = {
  stories: Record<string, any>[];
  addStory: (story: Record<string, any>) => void;
  updateStory: (id: string, data: Record<string, any>) => void;
  removeStory: (id: string) => void;
};

export const useStoryStore = create<StoryState>()(
  persist(
    (set) => ({
      stories: [],
      addStory: (story) => set((state) => ({ stories: [...state.stories, story] })),
      updateStory: (id, data) => set((state) => ({
        stories: state.stories.map((story) => 
          story.id === id ? { ...story, ...data } : story
        ),
      })),
      removeStory: (id) => set((state) => ({
        stories: state.stories.filter((story) => story.id !== id),
      })),
    }),
    {
      name: 'story-storage',
      storage: createJSONStorage(() => typeof window !== 'undefined' ? localStorage : null as any),
    }
  )
); 