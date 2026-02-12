import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { fetchCustomerByEmail } from '../../../lib/data';

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
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

