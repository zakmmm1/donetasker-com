import { supabase } from './supabase';

export async function updateUserRole(userId: string, updates: {
  role?: 'admin' | 'user';
  can_view_all_tasks?: boolean;
}): Promise<void> {
  const { error } = await supabase
    .from('company_users')
    .update(updates)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function getCompanyUsers(): Promise<Array<{
  user_id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user';
  can_view_all_tasks: boolean;
}>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // First get the user's company name
  const { data: userData, error: userError } = await supabase
    .from('user_settings')
    .select('company_name')
    .eq('user_id', user.id)
    .single();

  if (userError) {
    console.error('Failed to get user settings:', userError);
    throw new Error('Failed to get company settings');
  }

  if (!userData?.company_name) throw new Error('Company not found');

  // Then get all users in that company
  const { data: companyUsers, error: companyError } = await supabase
    .from('company_users')
    .select('user_id, email, full_name, role, can_view_all_tasks')
    .eq('company_name', userData.company_name);

  if (companyError) throw companyError;

  return companyUsers || [];
}

export async function addCompanyUser(user: {
  email: string;
  full_name: string;
  role: 'admin' | 'user';
  can_view_all_tasks: boolean;
}): Promise<void> {
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) throw new Error('Not authenticated');

  try {
    // Validate input
    if (!user.email || !user.full_name) {
      throw new Error('Email and full name are required');
    }

    // First get the current user's company name from user_settings
    const { data: userData, error: userError } = await supabase
      .from('user_settings')
      .select('company_name')
      .eq('user_id', currentUser.id)
      .single();

    if (userError) {
      console.error('User settings error:', userError);
      throw new Error('Failed to get company settings');
    }
    
    if (!userData?.company_name) {
      throw new Error('Company name not found - please set up your company first');
    }

    // Check admin permissions
    const { data: adminData, error: adminError } = await supabase
      .from('company_users')
      .select('role, company_name, status')
      .eq('user_id', currentUser.id)
      .eq('company_name', userData.company_name)
      .maybeSingle();

    if (adminError) {
      console.error('Admin verification error:', {
        error: adminError,
        code: adminError.code,
        details: adminError.details,
        hint: adminError.hint
      });
      throw new Error('Unable to verify admin permissions');
    }

    if (!adminData) {
      console.error('No company user record found:', {
        userId: currentUser.id,
        companyName: userData.company_name
      });
      throw new Error('You must be an admin to invite users');
    }

    if (adminData.status !== 'active') {
      console.error('User account not active:', {
        userId: currentUser.id,
        status: adminData.status,
        role: adminData.role
      });
      throw new Error('Your account must be active to invite users');
    }

    if (adminData.role !== 'admin' && adminData.role !== 'owner') {
      console.error('User not admin:', {
        userId: currentUser.id,
        role: adminData.role
      });
      throw new Error('You must be an admin to invite users');
    }

    // Check if user already exists in this company
    const { data: existingUser } = await supabase
      .from('company_users')
      .select('id, email, status, company_name')
      .eq('email', user.email.toLowerCase())
      .eq('company_name', userData.company_name)
      .maybeSingle();

    if (existingUser && existingUser.status === 'active') {
      console.error('User already exists:', {
        email: user.email,
        company: userData.company_name,
        status: existingUser.status
      });
      throw new Error('This user is already a member of your company');
    } else if (existingUser) {
      console.error('Pending invitation exists:', {
        email: user.email,
        company: userData.company_name,
        status: existingUser.status
      });
      throw new Error('This user already has a pending invitation');
    }

    // Create company user entry
    const { data: newUser, error: createError } = await supabase
      .from('company_users')
      .insert({
        email: user.email.toLowerCase(),
        full_name: user.full_name,
        company_name: userData.company_name,
        role: user.role,
        can_view_all_tasks: user.can_view_all_tasks,
        status: 'pending',
        invited_by: currentUser.id
      });

    if (createError) {
      console.error('Failed to create company user:', {
        error: createError,
        code: createError.code,
        details: createError.details,
        hint: createError.hint,
        message: createError.message,
        context: {
          email: user.email,
          company: userData.company_name,
          role: user.role
        }
      });
      if (createError.code === '23505') {
        throw new Error('This user already has a pending invitation');
      } else {
        throw new Error('Unable to add user at this time');
      }
    } else {
      console.log('Successfully created company user:', {
        email: user.email,
        company: userData.company_name,
        role: user.role
      });
    }

    return;
  } catch (err) {
    console.error('Add user error:', {
      error: err,
      ...(err instanceof Error ? {
        name: err.name,
        message: err.message,
        stack: err.stack
      } : {}),
      context: 'addCompanyUser function'
    });
    throw err instanceof Error ? err : new Error('An unexpected error occurred');
  }
}

export async function updateTaskCollaborators(
  taskId: string,
  collaborators: string[]
): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ collaborators })
    .eq('id', taskId);

  if (error) throw error;
}