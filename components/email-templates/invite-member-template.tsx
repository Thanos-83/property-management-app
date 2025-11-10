import * as React from 'react';
import { Html, Button } from '@react-email/components';

type EmailProps = {
  acceptUrl: string;
  expiresAt: string;
};

export function InviteMemberEmail(props: EmailProps) {
  const { acceptUrl, expiresAt } = props;

  return (
    <Html lang='en'>
      <Button href={acceptUrl}>Click me</Button>
      <p>
        This link expires on {expiresAt}
        and is single-use
      </p>
    </Html>
  );
}

export default InviteMemberEmail;
