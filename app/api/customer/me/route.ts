import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { fetchCustomerByEmail } from '../../../lib/data';

export async function GET() {
  const cookieStore = await cookies();
  const email = cookieStore.get('userEmail')?.value;
  if (!email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const customer = await fetchCustomerByEmail(email);
  if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

  return NextResponse.json({
    customer_id: customer.customer_id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
  });
}
