import { createClient } from '@/lib/utils/supabase/server';
import { checkAccess } from '@/lib/utils/gatekeeper';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Redirect if unauthenticated
  if (!user) {
    redirect('/auth/login');
  }

  // 2. Fetch Real Database Usage
  const { data: usage } = await supabase
    .from('user_usage')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // 3. Fetch Current Tier AND Dynamic Limits from the Gatekeeper
  const accessCheck = await checkAccess('properties');
  const currentTier = accessCheck?.currentTier || 'trial';
  const limits = accessCheck.limits;

  // 4. Calculate Progress Percentages for ALL metrics
  // Properties
  const propCount = usage?.properties_count || 0;
  const propLimit = limits?.properties || 2;
  const propPercent = Math.min((propCount / propLimit) * 100, 100);

  // Task Templates
  const taskCount = usage?.task_templates_count || 0;
  const taskLimit = limits?.task_templates || 3;
  const taskPercent = Math.min((taskCount / taskLimit) * 100, 100);

  // AI Parses
  const aiCount = usage?.ai_parses_count || 0;
  const aiLimit = limits?.ai_parses || 20;
  const aiPercent = Math.min((aiCount / aiLimit) * 100, 100);

  const getProgressColor = (percent: number) => {
    if (percent >= 100) return 'bg-destructive';
    if (percent >= 80) return 'bg-amber-500';
    return 'bg-primary';
  };

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-xl font-bold text-foreground'>Billing</h2>
        <p className='text-sm text-muted-foreground mt-1'>
          Manage your subscription, usage limits, and payment methods.
        </p>
      </div>

      {/* 1. CURRENT PLAN CARD */}
      <div className='flex flex-col md:flex-row md:items-center justify-between p-6 bg-white border border-border rounded-xl shadow-sm gap-4'>
        <div className='flex items-center gap-4'>
          <div className='bg-primary/10 p-3 rounded-full shrink-0'>
            <Zap className='w-6 h-6 text-primary fill-primary/20' />
          </div>
          <div>
            <div className='flex items-center gap-2 mb-1'>
              <h3 className='font-bold text-foreground capitalize text-lg'>
                {currentTier === 'trial' ? 'Free Trial' : `${currentTier}`}
              </h3>
              <Badge
                variant='secondary'
                className='bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] uppercase tracking-wider font-bold'>
                Active
              </Badge>
            </div>
            <p className='text-sm text-muted-foreground'>
              Billing managed securely via Stripe
            </p>
          </div>
        </div>
        <Button className='font-bold shadow-sm' asChild>
          <Link href='/dashboard/pricing'>Change Plan</Link>
        </Button>
      </div>

      {/* 2. USAGE THIS PERIOD CARD */}
      <div className='p-6 bg-white border border-border rounded-xl shadow-sm'>
        <h3 className='font-bold text-foreground mb-6 text-lg'>
          Usage this period
        </h3>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-10'>
          {/* Properties Progress */}
          <div className='space-y-3'>
            <div className='flex justify-between items-end'>
              <span className='text-sm font-semibold text-foreground'>
                Properties
              </span>
              <span className='text-sm text-muted-foreground'>
                <strong
                  className={
                    propPercent >= 100 ? 'text-destructive' : 'text-foreground'
                  }>
                  {propCount}
                </strong>{' '}
                of {propLimit === 999999 ? 'Unlimited' : propLimit}
              </span>
            </div>
            <div className='h-2 w-full bg-secondary rounded-full overflow-hidden'>
              <div
                className={`h-full rounded-full transition-all duration-500 ${getProgressColor(propPercent)}`}
                style={{ width: `${propPercent}%` }}
              />
            </div>
          </div>

          {/* Task Templates Progress */}
          <div className='space-y-3'>
            <div className='flex justify-between items-end'>
              <span className='text-sm font-semibold text-foreground'>
                Task Templates
              </span>
              <span className='text-sm text-muted-foreground'>
                <strong
                  className={
                    taskPercent >= 100 ? 'text-destructive' : 'text-foreground'
                  }>
                  {taskCount}
                </strong>{' '}
                of {taskLimit === 999999 ? 'Unlimited' : taskLimit}
              </span>
            </div>
            <div className='h-2 w-full bg-secondary rounded-full overflow-hidden'>
              <div
                className={`h-full rounded-full transition-all duration-500 ${getProgressColor(taskPercent)}`}
                style={{ width: `${taskPercent}%` }}
              />
            </div>
          </div>

          {/* AI Parses Progress */}
          <div className='space-y-3'>
            <div className='flex justify-between items-end'>
              <span className='text-sm font-semibold text-foreground'>
                AI Email Parses
              </span>
              <span className='text-sm text-muted-foreground'>
                <strong
                  className={
                    aiPercent >= 100 ? 'text-destructive' : 'text-foreground'
                  }>
                  {aiCount}
                </strong>{' '}
                of {aiLimit === 999999 ? 'Unlimited' : aiLimit}
              </span>
            </div>
            <div className='h-2 w-full bg-secondary rounded-full overflow-hidden'>
              <div
                className={`h-full rounded-full transition-all duration-500 ${getProgressColor(aiPercent)}`}
                style={{ width: `${aiPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. PAYMENT METHOD CARD */}
      <div className='p-6 bg-white border border-border rounded-xl shadow-sm'>
        <h3 className='font-bold text-foreground mb-4'>Payment method</h3>
        <div className='flex items-center justify-between p-4 border border-border rounded-lg bg-slate-50/50'>
          <div className='flex items-center gap-4'>
            <div className='w-12 h-8 bg-indigo-600 rounded flex items-center justify-center text-[10px] font-black text-white italic shadow-sm shrink-0'>
              VISA
            </div>
            <div>
              <div className='flex items-center gap-2'>
                <p className='text-sm font-medium text-foreground'>
                  Visa ending in 4242
                </p>
                <Badge
                  variant='outline'
                  className='text-[10px] uppercase font-semibold text-muted-foreground'>
                  Primary
                </Badge>
              </div>
              <p className='text-xs text-muted-foreground'>Expires 12/2028</p>
            </div>
          </div>
          <Button
            variant='outline'
            size='sm'
            className='font-semibold shadow-sm'>
            Update
          </Button>
        </div>
      </div>
    </div>
  );
}
