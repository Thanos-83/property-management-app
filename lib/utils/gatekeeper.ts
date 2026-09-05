import { createClient } from '@/lib/utils/supabase/server';

// 1. Expand the safe fallback for Trial users
export const TRIAL_LIMITS = {
  properties: 2,
  task_templates: 3,
  ai_parses: 30,
  team_members: 3,
  emails_sent: 50,
};

type SubscriptionMetadata = Record<string, string>;
type SubscriptionPrices = {
  products: {
    name: string;
    metadata: SubscriptionMetadata;
  };
};
export interface SubscriptionType {
  status: string;
  prices: SubscriptionPrices;
}

// 2. Expand the feature union type
export async function checkAccess(
  feature:
    | 'properties'
    | 'task_templates'
    | 'ai_parses'
    | 'team_members'
    | 'emails_sent',
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return { allowed: false, currentTier: 'none', limits: TRIAL_LIMITS };

  const { data: subscriptions, error } = await supabase
    .from('subscriptions')
    .select(
      `
      status,
      prices (
        products (
          name,
          metadata
        )
      )
    `,
    )
    .eq('user_id', user.id)
    .in('status', ['active', 'trialing'])
    .order('created', { ascending: false })
    .limit(1);

  if (error && error.code !== 'PGRST116') {
    console.error('Gatekeeper Subscription Error:', error);
  }

  const subscription =
    subscriptions && subscriptions.length > 0 ? subscriptions[0] : null;

  const productData = (subscription?.prices as unknown as SubscriptionPrices)
    ?.products;
  const currentTier = productData?.name || 'trial';

  // 3. Parse all limits dynamically from Stripe
  let limits = TRIAL_LIMITS;

  if (currentTier !== 'trial' && productData?.metadata) {
    limits = {
      properties:
        parseInt(productData.metadata.limit_properties) ||
        TRIAL_LIMITS.properties,
      task_templates:
        parseInt(productData.metadata.limit_task_templates) ||
        TRIAL_LIMITS.task_templates,
      ai_parses:
        parseInt(productData.metadata.limit_ai_parses) ||
        TRIAL_LIMITS.ai_parses,
      team_members:
        parseInt(productData.metadata.limit_team_members) ||
        TRIAL_LIMITS.team_members,
      emails_sent:
        parseInt(productData.metadata.limit_emails_sent) ||
        TRIAL_LIMITS.emails_sent,
    };
  }

  // 4. Fetch the user's current usage
  const { data: usage } = await supabase
    .from('user_usage')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Note: Ensure your user_usage table has 'team_members_count' and 'emails_sent_count' columns!
  const usageCount = usage ? usage[`${feature}_count`] : 0;
  const limitCount = limits[feature];

  const allowed = usageCount < limitCount;

  // Determine the exact reason if access is denied
  let reason = null;
  if (!allowed) {
    if (currentTier === 'none' || currentTier === 'trial') {
      reason = 'no_subscription';
    } else {
      reason = 'limit_reached';
    }
  }
  return {
    allowed,
    currentTier,
    limits,
    usageCount,
    reason,
  };
}
