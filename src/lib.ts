import { createClient } from '@supabase/supabase-js';
const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
export const supabase = createClient(url, key);
export const ADMIN_EMAIL = 'ddispatha@gmail.com';
export const CITIES = ['Lagos','Abuja','Delta State','Port Harcourt','Ibadan'];
export const CARGO = ['Medicals & pharmaceuticals','Beverages & drinks','Clothes & fashion','Food & groceries','General goods & parcels','E-commerce deliveries','Medical supplies & equipment','Corporate logistics','Furniture & bulky items','Heavy cargo & freight','Documents','Other specialised deliveries'];
export async function api(action:string, payload:Record<string,unknown>={}) {
  const {data:{session}} = await supabase.auth.getSession();
  if (!session) throw new Error('Please sign in again.');
  const {data,error} = await supabase.functions.invoke('dispatha-api',{body:{action,...payload}});
  if(error) throw error;
  if(data?.error) throw new Error(data.error);
  return data;
}
