'use server';

import { createClient } from "@/utils/supabase/server";

export async function getStaff(orgId: string, query: string = '', _filter: 'all' | 'active' | 'inactive' = 'all') {
  const supabase = await createClient();

  const dbQuery = supabase
    .from('org_user')
    .select(`
      id,
      role_id,
      created_at,
      profile:profiles (
        id,
        alias,
        user_id
      )
    `)
    .eq('org_id', orgId)
    .gte('role_id', 1); // Filter for staff (role >= 1)

  const { data, error } = await dbQuery;

  if (error) {
    console.error('Error fetching staff:', error);
    return [];
  }

  // Map and filter
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let staff = data.map((m: any) => {
    const profile = Array.isArray(m.profile) ? m.profile[0] : m.profile;
    return {
      id: m.id,
      profileId: profile?.id,
      alias: profile?.alias || 'Namnlös',
      userId: profile?.user_id,
      roleId: m.role_id,
      joinedAt: m.created_at,
      status: 'active', // org_user doesn't have status, assuming active if present
      isLocal: !profile?.user_id,
    };
  });

  if (query) {
    const lowerQuery = query.toLowerCase();
    staff = staff.filter(s => 
      s.alias.toLowerCase().includes(lowerQuery)
    );
  }

  return staff;
}

export async function inviteStaff(orgId: string, email: string, firstName: string, lastName: string) {
  // Placeholder for invite logic
  // In a real app, this would call supabase.auth.admin.inviteUserByEmail or an Edge Function
  
  // We can simulate a delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log(`Inviting staff: ${email}, ${firstName} ${lastName} to org ${orgId}`);
  
  return { success: true, message: "Inbjudan skickad (simulerad)" };
}
