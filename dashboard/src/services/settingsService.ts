import { supabase } from '../lib/supabase';

export interface SubscriptionPlan {
  id: string;
  title: string;
  price: number;
  period: string;
  is_popular: boolean;
  active: boolean;
}

export const fetchPlans = async (): Promise<SubscriptionPlan[]> => {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .order('price', { ascending: true });

  if (error) {
    console.error('Error fetching plans:', error);
    return [];
  }
  
  return data || [];
};

export const updatePlanPrice = async (id: string, newPrice: number): Promise<boolean> => {
  const { error } = await supabase
    .from('subscription_plans')
    .update({ price: newPrice, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Error updating plan:', error);
    return false;
  }
  
  return true;
};
