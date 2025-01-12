import { supabase } from './supabase';

interface UserSettings {
  company_name?: string;
  timezone?: string;
}

export async function updateUserSettings(settings: UserSettings) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('No authenticated user');
  
  // First check if settings already exist
  const { data: existingSettings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (existingSettings) {
    // Update existing settings
    const { error } = await supabase
      .from('user_settings')
      .update(settings)
      .eq('user_id', user.id);

    if (error) throw error;
  } else {
    // Create new settings
    const { error } = await supabase
      .from('user_settings')
      .insert([{
        user_id: user.id,
        ...settings
      }]);

    if (error) throw error;
  }
}

export async function getUserSettings(): Promise<UserSettings | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('No authenticated user');
  }

  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    // If no settings exist, create default settings
    if (error?.code === 'PGRST116' || !data) {
      const defaultSettings = {
        user_id: user.id,
        company_name: user.user_metadata?.company_name || 'My Company',
        timezone: user.user_metadata?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      const { data: newSettings, error: createError } = await supabase
        .from('user_settings')
        .upsert([defaultSettings])
        .select()
        .single();

      if (createError) throw createError;
      return newSettings;
    }

    if (error) {
      console.error('Failed to fetch user settings:', error);
      // Return default settings on error
      return {
        company_name: user.user_metadata?.company_name || 'My Company',
        timezone: user.user_metadata?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
      };
    }

    return data;
  } catch (err) {
    console.error('Failed to handle user settings:', err);
    // Return default settings on any error
    return {
      company_name: user.user_metadata?.company_name || 'My Company',
      timezone: user.user_metadata?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }
}