import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const headersList = headers();
    const svixId = headersList.get('svix-id');
    const svixTimestamp = headersList.get('svix-timestamp');
    const svixSignature = headersList.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json(
        { error: 'Missing svix headers' },
        { status: 400 }
      );
    }

    const body = await req.text();
    const webhook = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

    let event;
    try {
      event = webhook.verify(body, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      });
    } catch (err) {
      console.error('Webhook verification failed:', err);
      return NextResponse.json(
        { error: 'Webhook verification failed' },
        { status: 400 }
      );
    }

    // Handle user.created event
    if (event.type === 'user.created') {
      const { id, email_addresses, first_name, last_name } = event.data;
      const email = email_addresses?.[0]?.email_address || '';
      const name = `${first_name || ''} ${last_name || ''}`.trim();

      // Create user in database
      await prisma.user.create({
        data: {
          clerkId: id,
          email,
          name: name || email,
        },
      });

      return NextResponse.json({ status: 'user_created' });
    }

    // Handle user.updated event (sync changes)
    if (event.type === 'user.updated') {
      const { id, email_addresses, first_name, last_name } = event.data;
      const email = email_addresses?.[0]?.email_address || '';
      const name = `${first_name || ''} ${last_name || ''}`.trim();

      // Update user in database
      await prisma.user.update({
        where: { clerkId: id },
        data: {
          email,
          name: name || email,
        },
      });

      return NextResponse.json({ status: 'user_updated' });
    }

    // Handle user.deleted event
    if (event.type === 'user.deleted') {
      const { id } = event.data;

      // Delete user from database
      await prisma.user.deleteMany({
        where: { clerkId: id },
      });

      return NextResponse.json({ status: 'user_deleted' });
    }

    return NextResponse.json({ status: 'ignored' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
