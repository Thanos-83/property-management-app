// We map these directly to the "name" of the product in Stripe
export const PLAN_FEATURES: Record<string, string[]> = {
  'Basic Plan': [
    'Up to 5 Property Listings',
    'Up to 3 Team Members',
    'Up to 5 Task Templates',
    '50 AI Parses / month',
    '500 Automated Emails / month',
    'Unlimited Calendar & iCal Sync',
    'Standard Support',
  ],
  'Pro Plan': [
    'Up to 20 Property Listings',
    'Up to 10 Team Members',
    'Up to 20 Task Templates',
    '500 AI Parses / month',
    '2,000 Automated Emails / month',
    '100 SMS Messages / month',
    'Unlimited Calendar & iCal Sync',
    'Priority Support',
  ],
  'Premium Plan': [
    'Unlimited Property Listings',
    'Unlimited Team Members',
    'Unlimited Task Templates',
    '2,000 AI Parses / month',
    'Unlimited Automated Emails',
    '500 SMS Messages / month',
    'Unlimited Calendar & iCal Sync',
    '24/7 Dedicated Support',
  ],
};
